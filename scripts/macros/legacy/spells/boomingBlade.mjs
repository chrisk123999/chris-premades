import {dialogUtils, documentUtils, itemUtils, workflowUtils} from '../../../proxy.mjs';
async function moved({document: effect, token, action, teleport}) {
    if (teleport || action === 'catForce') return;
    const origin = await fromUuid(effect.origin);
    const item = origin?.documentName === 'ActiveEffect' ? origin.parent : origin;
    const activity = item ? itemUtils.getActivityByIdentifier(item, 'moved') : undefined;
    if (!activity) return;
    if (!await dialogUtils.confirm(effect.name, _loc('CHRISPREMADES.Macros.Legacy.BoomingBlade.WillingMove', {actorName: token.name}))) return;
    await workflowUtils.completeActivityUse(activity, [token], {spellSlot: false});
    await documentUtils.deleteDocument(effect);
}
export const boomingBladeMoved = {
    name: 'Booming Blade: Moved',
    version: '2.0.0',
    rules: '2014',
    move: [
        {
            pass: 'actorMoved',
            macro: moved,
            priority: 250
        }
    ]
};
