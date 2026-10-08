import {actorUtils, automationUtils, constants, documentUtils, effectUtils} from '../../../../../proxy.mjs';
async function early({document, workflow}) {
    if (!workflow.targets.size) return;
    const classLevels = workflow.actor.classes[automationUtils.getConfigValue(document, 'classIdentifier')]?.system.levels ?? 0;
    const immuneTokens = Array.from(workflow.targets, target => target.document ?? target).filter(token => actorUtils.getLevelOrCR(token.actor) >= classLevels);
    if (!immuneTokens.length) return;
    const effectData = documentUtils.getBaseEffectData(document, {
        name: _loc('CHRISPREMADES.Macros.Legacy.ControlUndead.InvalidTarget'),
        img: constants.tempConditionIcon,
        origin: document.uuid,
        duration: {turns: 1},
        specialDuration: ['endOfWorkflow'],
        changes: [
            {key: 'flags.midi-qol.success.ability.save.all', value: 'true', type: 'override', priority: 120}
        ]
    });
    await Promise.all(immuneTokens.map(token => effectUtils.createEffects(token.actor, [effectData])));
}
async function use({document, workflow}) {
    const existingEffect = documentUtils.getEffectByIdentifier(workflow.actor, 'controlUndead');
    if (existingEffect) await documentUtils.deleteDocument(existingEffect);
    if (!workflow.failedSaves.size) return;
    const targetToken = workflow.failedSaves.first();
    const casterEffect = documentUtils.getEffectByIdentifier(document, 'controlUndead');
    const targetEffect = documentUtils.getEffectByIdentifier(document, 'controlUndeadControlled');
    if (!casterEffect || !targetEffect) return;
    const [effect] = await effectUtils.createEffects(workflow.actor, [documentUtils.getEffectData(workflow.activity, casterEffect.id, {activityUuid: workflow.activity.uuid})]);
    if (!effect) return;
    await effectUtils.createEffects((targetToken.document ?? targetToken).actor, [documentUtils.getEffectData(workflow.activity, targetEffect.id, {activityUuid: workflow.activity.uuid})], {parentEntity: effect});
}
export const controlUndead = {
    name: 'Channel Divinity: Control Undead',
    version: '2.0.4',
    rules: '2014',
    roll: [
        {pass: 'itemPreambleComplete', macro: early, priority: 100},
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        classIdentifier: {
            default: 'paladin',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    }
};
