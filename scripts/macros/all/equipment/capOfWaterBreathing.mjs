import {actorUtils, documentUtils} from '../../../proxy.mjs';
async function unequipped({document: item}) {
    const effect = item.actor && actorUtils.getEffectByIdentifier(item.actor, 'capOfWaterBreathing');
    if (effect) await documentUtils.deleteDocument(effect);
}
export const capOfWaterBreathing = {
    name: 'Cap of Water Breathing',
    version: '2.1.8',
    rules: 'all',
    item: [
        {
            pass: 'unequipped',
            macro: unequipped,
            priority: 50
        }
    ]
};
