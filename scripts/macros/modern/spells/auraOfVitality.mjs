import {actorUtils, dialogUtils, effectUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function heal(item, token, firstCast, atLevel) {
    const activity = itemUtils.getActivityByIdentifier(item, 'aura-of-vitality-heal');
    if (!activity || !token) return;
    const nearby = tokenUtils.findNearby(token, 30, {disposition: 'ally', includeToken: true});
    const selection = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.Modern.AuraOfVitality.Select', nearby, {skipDeadAndUnconscious: false, userId: queryUtils.firstOwner(item.actor, true)});
    if (!selection?.result) return;
    const options = {};
    if (firstCast) workflowUtils.setNotSustainedRoll(options);
    await workflowUtils.completeActivityUse(activity, [selection.result], {atLevel, options, consumeUsage: false, consumeResources: false, spellSlot: false});
}
async function cast({workflow}) {
    if (workflow.activity.identifier === 'aura-of-vitality-heal' || !workflow.tokenDocument) return;
    await heal(workflow.item, workflow.tokenDocument, true, workflow.castData.castLevel);
}
async function turnStart({document: effect, token}) {
    const level = effectUtils.getCastData(effect)?.castLevel;
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    if (item) await heal(item, token ?? actorUtils.getFirstToken(effect.parent), false, level || item.system.level);
}
export const auraOfVitality = {
    name: 'Aura of Vitality',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {pass: 'itemRollFinished', macro: cast, priority: 50}
    ]
};
export const auraOfVitalityTurn = {
    name: 'Aura of Vitality: Turn Start',
    version: auraOfVitality.version,
    rules: auraOfVitality.rules,
    combat: [
        {pass: 'actorTurnStart', macro: turnStart, priority: 50}
    ]
};
