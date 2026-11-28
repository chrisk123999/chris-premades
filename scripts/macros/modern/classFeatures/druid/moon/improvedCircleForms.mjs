import {automationUtils, constants, documentUtils} from '../../../../../proxy.mjs';
async function transformed({document: item, data}) {
    const ability = automationUtils.getConfigValue(item, 'ability') ?? improvedCircleForms.config.ability.default;
    const damageType = automationUtils.getConfigValue(item, 'damageType') ?? improvedCircleForms.config.damageType.default;
    const mod = data.actor.system.abilities[ability]?.mod ?? 0;
    if (mod > 0) data.effectData.system.changes.push({key: 'system.abilities.con.save.roll.bonus', type: 'add', value: String(mod), priority: 20});
    const updates = data.newActor.items.map(entry => {
        const activities = entry.system.activities?.filter(activity => activity.type === 'attack' && activity.damage?.parts?.length) ?? [];
        const update = {_id: entry.id};
        if (entry.type === 'weapon' && !entry.system.damage.base.types.has(damageType)) update['system.damage.base.types'] = [...entry.system.damage.base.types, damageType];
        for (const activity of activities) {
            update[`system.activities.${activity.id}.damage.parts`] = activity.damage.parts.map(part => ({...part.toObject?.() ?? part, types: [...new Set([...part.types, damageType])]}));
        }
        return Object.keys(update).length > 1 ? update : null;
    }).filter(Boolean);
    if (updates.length) await documentUtils.updateEmbeddedDocuments(data.newActor, 'Item', updates);
}
export const improvedCircleForms = {
    name: 'Improved Circle Forms',
    version: '2.1.11',
    rules: '2024',
    called: [
        {
            pass: 'actorWildShape',
            macro: transformed,
            priority: 50
        }
    ],
    config: {
        ability: {
            default: 'wis',
            type: 'select',
            get options() {
                return constants.abilityOptions;
            },
            label: 'CHRISPREMADES.Config.Ability',
            category: 'homebrew'
        },
        damageType: {
            default: 'radiant',
            type: 'select',
            get options() {
                return constants.damageTypeOptions;
            },
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew'
        }
    }
};
