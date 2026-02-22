import {activityUtils, dialogUtils, constants, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../../utils.js';

async function compressionLock({trigger: {entity: item, token}, workflow}) {
    let grapplingEffects = effectUtils.getAllEffectsByIdentifier(token.actor, 'grappling');
    let potentialTargets = grapplingEffects.map(i => token.scene.tokens.get(i.flags['chris-premades'].grapple.tokenId)?.object).filter(i => i);
    if (!potentialTargets.length) return;
    let feature = activityUtils.getActivityByIdentifier(item, 'compressionLock', {strict: true});
    if (!feature) return;
    let formula = (await rollUtils.damageRoll(feature.damage.parts[0].formula, token.actor)).formula;
    let result = await dialogUtils.selectTargetDialog(
        item.name,
        genericUtils.format('CHRISPREMADES.Macros.Groundwork.CompressionLock', {formula}),
        potentialTargets,
        {type: 'multiple', maxAmount:potentialTargets.length}
    );
    if (!result) return;
    let [targets, filterDefeated] = result;
    if (!targets || !targets.length) return;
    if (filterDefeated) targets = targets.filter(t => t.actor?.system.attributes.hp.value > 0);
    if (!targets.length) return;
    await workflowUtils.syntheticActivityRoll(feature, targets);
}
async function inescapable({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size) return;
    let id = activityUtils.getIdentifier(workflow.activity);
    if (!['grapple', 'shovePush', 'shoveProne'].includes(id)) return;
    let moxie = itemUtils.getItemByIdentifier(workflow.actor, 'moxie');
    if (!moxie?.system.uses.value) return;
    let inescapable = activityUtils.getActivityByIdentifier(item, 'inescapable', {strict: true});
    if (!inescapable) return;
    let effectData = {
        name: workflow.item.name + ':' + genericUtils.translate('DND5E.Disadvantage'),
        img: constants.tempConditionIcon,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.save.all',
                value: '1',
                mode: 5,
                priority: 120
            }
        ]
    };
    let choice = await dialogUtils.confirm(
        item.name, 
        genericUtils.format('CHRISPREMADES.Dialog.UseExtraCost', {
            itemName: inescapable.name, 
            quantity: 1, 
            quantityName: moxie.name
        }) + '<br>' +
        genericUtils.format('CHRISPREMADES.Macros.Groundwork.Inescapable', {activityName: workflow.activity.name})
    );
    if (!choice) return;
    await Promise.all(workflow.targets.map(async token => 
        effectUtils.createEffect(token.document.actor, effectData, {identifier: 'inescapable', animate: false})
    ));
    await workflowUtils.completeActivityUse(inescapable);
    await genericUtils.update(moxie, {'system.uses.spent': moxie.system.uses.spent + 1});
}
async function inescapableCleanup({workflow}) {
    if (!workflow.targets.size) return;
    let id = activityUtils.getIdentifier(workflow.activity);
    if (!['grapple', 'shovePush', 'shoveProne'].includes(id)) return;
    await Promise.all(workflow.targets.map(async token => {
        let effect = effectUtils.getEffectByIdentifier(token.actor, 'inescapable');
        if (effect) await genericUtils.remove(effect);
    }));
}
export let groundwork = {
    name: 'Groundwork',
    version: '1.4.25',
    rules: 'modern',
    combat: [
        {
            pass: 'turnStart',
            macro: compressionLock,
            priority: 50
        }
    ],
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: inescapable,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: inescapableCleanup,
                priority: 50
            }
        ]
    }
};
