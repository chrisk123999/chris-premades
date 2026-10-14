import {automationUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, queryUtils, workflowUtils} from '../../../proxy.mjs';
function getActivities(document) {
    return {
        damage: itemUtils.getActivityByIdentifier(document, 'heat-metal-damage'),
        held: itemUtils.getActivityByIdentifier(document, 'heat-metal-held'),
        pulse: itemUtils.getActivityByIdentifier(document, 'heat-metal-pulse')
    };
}
function playAnimation(document, workflow, targetToken, cast) {
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    if (!workflow.token || !animation?.macros?.play) return;
    animation.macros.play(workflow.token.document, targetToken, {...options, cast: cast && options.cast});
}
async function heldCheck(document, targetToken, casterEffect, held) {
    let choice = 'unable';
    if (!casterEffect.flags['chris-premades'].heatMetal.unable) {
        choice = await dialogUtils.buttonDialog(document.name, _loc('CHRISPREMADES.Macros.All.HeatMetal.Drop'), [
            ['Yes', 'drop'],
            ['No', 'keep'],
            ['CHRISPREMADES.Macros.All.HeatMetal.Unable', 'unable']
        ], {userId: queryUtils.firstOwner(targetToken.actor, true)});
        if (choice === 'drop') return;
        if (choice === 'unable') await documentUtils.setFlag(casterEffect, 'chris-premades', 'heatMetal.unable', true);
    }
    if (choice !== 'unable') {
        const heldWorkflow = await workflowUtils.syntheticActivityRoll(held, [targetToken], {spellSlot: false});
        if (heldWorkflow?.failedSaves.size) {
            await ChatMessage.implementation.create({
                speaker: ChatMessage.implementation.getSpeaker({token: targetToken}),
                content: _loc('CHRISPREMADES.Macros.All.HeatMetal.MustDrop')
            });
            return;
        }
    }
    const heldEffect = documentUtils.getEffectByIdentifier(document, 'heatMetalHeld');
    if (!heldEffect) return Logging.addMacroWarning('CPR', 'heat-metal', 'Heat Metal: Held effect missing from item.', {notify: 'warn'});
    const effectData = documentUtils.getEffectData(held, heldEffect.id, {parentEntity: casterEffect});
    await effectUtils.createEffects(targetToken.actor, [effectData]);
}
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'heat-metal') return;
    const target = workflow.targets.first();
    if (!target) {
        Logging.addMacroWarning('CPR', 'heat-metal', 'No target selected.');
        await effectUtils.endConcentration(workflow.actor, workflow.item);
        return;
    }
    const {damage, held, pulse} = getActivities(document);
    if (!damage || !held || !pulse) {
        Logging.addMacroWarning('CPR', 'heat-metal', 'Heat Metal activities missing from item.', {notify: 'warn'});
        await effectUtils.endConcentration(workflow.actor, workflow.item);
        return;
    }
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const casterEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'heatMetal',
        activityUuid: workflow.activity.uuid,
        unhideActivities: ['heat-metal-pulse'],
        favoriteActivities: true,
        vae: [{type: 'use', name: pulse.name, itemIdentifier: documentUtils.getIdentifier(document), activityIdentifier: 'heat-metal-pulse'}]
    });
    genericUtils.setProperty(casterEffectData, 'flags.chris-premades.heatMetal', {targetUuid: target.document.uuid, unable: false});
    const [casterEffect] = await effectUtils.createEffects(workflow.actor, [casterEffectData], {parentEntity: concentrationEffect});
    if (!casterEffect) return;
    playAnimation(document, workflow, target.document, true);
    await workflowUtils.syntheticActivityRoll(damage, [target.document], {spellSlot: false, atLevel: workflowUtils.getCastLevel(workflow)});
    await heldCheck(document, target.document, casterEffect, held);
}
async function pulse({document, workflow}) {
    if (workflow.activity.identifier !== 'heat-metal-pulse') return;
    const casterEffect = documentUtils.getEffectByIdentifier(workflow.actor, 'heatMetal');
    if (!casterEffect) return Logging.addMacroWarning('CPR', 'heat-metal', 'No active Heat Metal.');
    const targetToken = fromUuidSync(casterEffect.flags['chris-premades'].heatMetal.targetUuid, {strict: false});
    if (!targetToken?.actor) return Logging.addMacroWarning('CPR', 'heat-metal', 'Heat Metal target token not found.');
    const {damage, held} = getActivities(document);
    if (!damage || !held) return Logging.addMacroWarning('CPR', 'heat-metal', 'Heat Metal activities missing from item.', {notify: 'warn'});
    playAnimation(document, workflow, targetToken, false);
    await workflowUtils.syntheticActivityRoll(damage, [targetToken], {spellSlot: false, atLevel: workflowUtils.getCastLevel(workflow)});
    await heldCheck(document, targetToken, casterEffect, held);
}
export const heatMetal = {
    name: 'Heat Metal',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: pulse,
            priority: 50
        }
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'heatMetal'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
