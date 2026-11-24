import {automationUtils, compendiumUtils, itemUtils} from '../../../../../proxy.mjs';
function usesCost(activity) {
    return activity.consumption?.targets?.filter(target => target.type === 'itemUses').reduce((total, target) => total + (Number(target.value) || 0), 0) ?? 0;
}
async function forms({document: item, data}) {
    if (data.rules !== '2014') return;
    const source = itemUtils.getActivityByIdentifier(item, 'elemental-wild-shape');
    if (!source || (data.activity.item.system.uses.value ?? 0) < usesCost(data.activity) + usesCost(source)) return;
    const names = ['airName', 'earthName', 'fireName', 'waterName'].map(key => automationUtils.getConfigValue(item, key) ?? elementalWildShape.config[key].default).filter(Boolean);
    const packIds = compendiumUtils.getEnabledCompendiumIds('monsterCompendiums');
    const entries = (await Promise.all(packIds.map(packId => compendiumUtils.getFilteredActors({packIds: [packId], names})))).flat();
    const actors = (await Promise.all(entries.map(entry => fromUuid(entry.uuid)))).filter(Boolean);
    const chosen = new Map();
    for (const actor of actors) {
        const current = chosen.get(actor.name);
        if (!current || (current.system.source?.rules !== '2014' && actor.system.source?.rules === '2014')) chosen.set(actor.name, actor);
    }
    return Array.from(chosen.values(), actor => ({actor, source}));
}
export const elementalWildShape = {
    name: 'Elemental Wild Shape',
    version: '2.1.11',
    rules: '2014',
    called: [
        {
            pass: 'actorWildShapeForms',
            macro: forms,
            priority: 50
        }
    ],
    config: {
        airName: {
            default: 'Air Elemental',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Legacy.ElementalWildShape.AirName',
            category: 'homebrew'
        },
        earthName: {
            default: 'Earth Elemental',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Legacy.ElementalWildShape.EarthName',
            category: 'homebrew'
        },
        fireName: {
            default: 'Fire Elemental',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Legacy.ElementalWildShape.FireName',
            category: 'homebrew'
        },
        waterName: {
            default: 'Water Elemental',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Legacy.ElementalWildShape.WaterName',
            category: 'homebrew'
        }
    }
};
