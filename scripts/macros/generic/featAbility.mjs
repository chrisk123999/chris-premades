import {actorUtils, automationUtils, constants, documentUtils, genericUtils, itemUtils} from '../../proxy.mjs';
function getFeatItems(item) {
    const parentName = item.name.split(':')[0].trim();
    const identifier = documentUtils.getIdentifier(item) ?? '';
    const parents = item.actor.items.filter(feat => feat.type === 'feat' && feat !== item && (feat.name === parentName || identifier.startsWith(documentUtils.getIdentifier(feat) + '-')));
    return [item, itemUtils.getAdvancementSourceItem(item), ...parents].filter(Boolean);
}
export function getChosenFeatAbility(item, abilities) {
    for (const feat of getFeatItems(item)) {
        for (const advancement of feat.advancement?.byType?.AbilityScoreImprovement ?? []) {
            const ability = abilities.find(key => advancement.value.assignments?.[key] > 0);
            if (ability) return ability;
        }
    }
}
export function getFeatAbility(item, abilities) {
    return getChosenFeatAbility(item, abilities) ?? actorUtils.getBestAbility(item.actor, abilities);
}
async function cachedSpellsCreated(item) {
    for (let attempt = 0; attempt < 20 && item.system.activities.getByType('cast').some(activity => !activity.cachedSpell); attempt++) await genericUtils.sleep(100);
}
async function added({document: item}) {
    const {abilities} = automationUtils.getGenericConfigValues(item, 'chris-premades', 'featAbility', configKeys);
    if (!item.actor || !abilities.length) return;
    await cachedSpellsCreated(item);
    const chosen = getChosenFeatAbility(item, abilities);
    const ability = chosen ?? actorUtils.getBestAbility(item.actor, abilities);
    const formula = chosen ? '8 + @prof + @abilities.' + chosen + '.mod' : undefined;
    const updates = {};
    for (const activity of item.system.activities) {
        const path = 'system.activities.' + activity.id;
        if (activity.type === 'save' && formula && activity.save.dc.formula !== formula) {
            updates[path + '.save.dc.calculation'] = '';
            updates[path + '.save.dc.formula'] = formula;
        } else if (activity.type === 'attack' && activity.attack.ability !== ability) {
            updates[path + '.attack.ability'] = ability;
        } else if (activity.type === 'cast' && activity.spell.ability !== ability) {
            updates[path + '.spell.ability'] = ability;
        }
    }
    if (Object.keys(updates).length) await documentUtils.update(item, updates);
}
/**
 * Uses the ability chosen for a feat's ability score increase in the item's save DCs, attacks and cast spells.
 * Bound on an item. Fires on `created`, `medkit`, and `munched`.
 * The choice is read from the item, the feature that granted it, or the feat it is part of.
 * Without a recorded choice, save DCs keep their formula and attacks and spells use the highest listed ability.
 *
 * Config:
 * - `abilities`: abilities the feat chooses between.
 */
export const featAbility = {
    version: '2.1.9',
    rules: 'all',
    category: 'utility',
    generic: true,
    documents: ['item'],
    item: [
        {pass: 'created', macro: added, priority: 50},
        {pass: 'medkit', macro: added, priority: 50},
        {pass: 'munched', macro: added, priority: 50}
    ],
    genericConfig: {
        abilities: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Abilities',
            hint: 'CHRISPREMADES.Macros.Generic.FeatAbility.AbilitiesHint',
            get options() { return constants.abilityOptions; }
        }
    }
};
const configKeys = Object.keys(featAbility.genericConfig);
