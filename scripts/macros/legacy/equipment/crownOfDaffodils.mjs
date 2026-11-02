import {documentUtils, itemUtils, workflowUtils} from '../../../proxy.mjs';
async function bestow({document: item, workflow}) {
    if (workflow.activity.identifier !== 'bestow') return;
    const live = item.actor.items.get(item.id);
    if (!live || live.system.uses.value) return;
    const passive = documentUtils.getEffectByIdentifier(live, 'crownOfDaffodilsSelfEffect');
    if (passive) await documentUtils.update(passive, {disabled: true});
    const wither = itemUtils.getActivityByIdentifier(live, 'wither');
    if (!wither) return;
    const witherWorkflow = await workflowUtils.syntheticActivityRoll(wither, [workflow.token.document], {consumeUsage: false, consumeResources: false});
    if (witherWorkflow?.utilityRolls?.[0]?.total === 1) await documentUtils.deleteDocument(live);
}
async function bloom({document: item}) {
    const passive = documentUtils.getEffectByIdentifier(item, 'crownOfDaffodilsSelfEffect');
    if (passive?.disabled && item.system.uses.value) await documentUtils.update(passive, {disabled: false});
}
export const crownOfDaffodils = {
    name: 'Crown of Daffodils',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: bestow,
            priority: 50
        }
    ],
    rest: [
        {
            pass: 'actorLong',
            macro: bloom,
            priority: 50
        }
    ]
};
