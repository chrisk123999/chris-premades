import {actorUtils, dialogUtils, documentUtils, effectUtils, itemUtils, queryUtils, workflowUtils} from '../../../../proxy.mjs';
async function died({document, effect}) {
    if (!effect.statuses.has('dead')) return;
    const item = effectUtils.getOriginActivitySync(document)?.item;
    const activity = item && itemUtils.getActivityByIdentifier(item, 'reform');
    if (!activity || !await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(document.parent, true)})) return;
    await workflowUtils.completeActivityUse(activity);
    await Promise.all(actorUtils.getTokens(document.parent).map(token => documentUtils.update(token, {hidden: true})));
}
export const infernalMajestyEffect = {
    name: 'Infernal Majesty: Effect',
    version: '2.1.10',
    rules: '2014',
    effect: [
        {
            pass: 'actorCreated',
            macro: died,
            priority: 50
        }
    ]
};
