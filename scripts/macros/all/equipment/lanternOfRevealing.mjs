import {actorUtils, documentUtils} from '../../../proxy.mjs';
const lights = {bright: 'lanternOfRevealingBright', dim: 'lanternOfRevealingDim'};
async function swap({document: item, activity}) {
    if (!lights[activity.identifier]) return;
    const current = Object.values(lights).map(identifier => actorUtils.getEffectByIdentifier(item.actor, identifier)).find(Boolean);
    if (!current) return;
    await documentUtils.deleteDocument(current);
    if (current.flags.cat.identifier === lights[activity.identifier]) return true;
}
export const lanternOfRevealing = {
    name: 'Lantern of Revealing',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: swap,
            priority: 50
        }
    ]
};
