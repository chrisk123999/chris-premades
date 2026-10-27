import {documentUtils, itemUtils, workflowUtils} from '../../../proxy.mjs';
async function use({workflow}) {
    if (workflow.activity.identifier !== 'crown-of-stars') return;
    const attack = itemUtils.getActivityByIdentifier(workflow.item, 'crown-of-stars-attack');
    if (!attack) return;
    const castLevel = workflowUtils.getCastLevel(workflow) ?? workflow.item.system.level;
    const item = workflow.actor.items.get(workflow.item.id);
    if (item) await documentUtils.update(item, {['system.activities.' + attack.id + '.uses']: {max: String(7 + 2 * (castLevel - 7)), spent: 0}});
}
async function attack({workflow}) {
    if (workflow.activity.identifier !== 'crown-of-stars-attack') return;
    const effect = documentUtils.getEffectByIdentifier(workflow.actor, 'crownOfStarsEffect');
    if (!effect) return;
    const remaining = workflow.actor.items.get(workflow.item.id)?.system.activities.get(workflow.activity.id)?.uses.value ?? 0;
    if (remaining <= 0) {
        await documentUtils.deleteDocument(effect);
        return;
    }
    if (remaining > 3 || effect.system.changes.some(change => change.key === 'token.light.dim' && Number(change.value) === 30)) return;
    await documentUtils.update(effect, {'system.changes': [{key: 'token.light.dim', value: '30', priority: 20, type: 'upgrade', phase: 'initial'}]});
}
export const crownOfStars = {
    name: 'Crown of Stars',
    version: '2.1.4',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: attack,
            priority: 60
        }
    ]
};
