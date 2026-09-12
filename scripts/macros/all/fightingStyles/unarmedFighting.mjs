import {dialogUtils, queryUtils, workflowUtils} from '../../../proxy.mjs';
async function turnStart({document: item, actor}) {
    // TODO grapple system
    const grappled = [];
    if (!grappled.length) return;
    let target = grappled[0];
    const userId = queryUtils.firstOwner(actor, true);
    if (grappled.length > 1) {
        const selected = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.All.UnarmedFighting', grappled, {skipDeadAndUnconscious: false, userId});
        if (!selected) return;
        target = selected.result;
    }
    await workflowUtils.syntheticItemRoll(item, [target], {userId});
}
export const unarmedFighting = {
    name: 'Unarmed Fighting',
    version: '2.0.3',
    rules: 'all',
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};
