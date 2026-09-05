import {actorUtils, dialogUtils, documentUtils, workflowUtils} from '../../../../proxy.mjs';
async function use({document, actor, token}) {
    const exhaustion = actor.system.attributes.exhaustion;
    if (exhaustion) await documentUtils.update(actor, {'system.attributes.exhaustion': exhaustion - 1});
    const extremeResilience = actorUtils.getItemByIdentifier(actor, 'extreme-resilience');
    if (!extremeResilience) return;
    const item = actor.items.find(item => {
        const uses = item.system.uses;
        if (!uses || !uses.max) return false;
        if (uses.value >= uses.max) return false;
        return uses.recovery?.some(r => r.period === 'lr');
    });
    if (item) await workflowUtils.completeItemUse(extremeResilience, [token]);
}
export const powerNap = {
    name: 'Power Nap',
    version: '2.0.3',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};