import {errors, effectUtils, genericUtils, itemUtils, rollUtils} from '../../utils.js';
function getActivityByIdentifier(item, identifier, {strict = false} = {}) {
    let activity = item.system.activities.find(i => getIdentifier(i) === identifier);
    if (!activity && strict) {
        errors.missingActivity(identifier);
    }
    return activity;
}
function getIdentifier(activity) {
    let identifiers = Object.entries(activity?.item?.flags?.['chris-premades']?.activityIdentifiers ?? {});
    if (!identifiers.length) return;
    return identifiers.find(i => i[1] === activity.id)?.[0];
}
async function setIdentifier(activity, identifier) {
    let item = activity.item;
    if (!item) return;
    let identifiers = Object.entries(item.flags?.['chris-premades']?.activityIdentifiers ?? {});
    let existingIdentifierInd = identifiers.findIndex(i => i[1] === activity.id);
    let oldIdentifier;
    if (existingIdentifierInd > -1) {
        oldIdentifier = identifiers[existingIdentifierInd][0];
        identifiers = identifiers.toSpliced(existingIdentifierInd, 1);
    }
    identifiers.push([identifier, activity.id]);
    let updates = {
        'flags.chris-premades.activityIdentifiers': Object.fromEntries(identifiers)
    };
    if (oldIdentifier) {
        updates['flags.chris-premades.activityIdentifiers.-=' + oldIdentifier] = null;
    }
    await genericUtils.update(item, updates);
}

function withChangedDamage(activity, formulaOrObj, types=[], {specificIndex = 0} = {}) {
    let activityData = genericUtils.duplicate(activity.toObject());
    let isHeal = activityData.type === 'heal';
    let isFormula = foundry.utils.getType(formulaOrObj) !== 'Object';
    let formula, number, denomination, bonus;
    if (isFormula) {
        formula = formulaOrObj;
    } else {
        number = formulaOrObj.number;
        denomination = formulaOrObj.denomination;
        bonus = formulaOrObj.bonus ?? '';
        formula = '';
        if (number && denomination) formula += number + 'd' + denomination;
        if (bonus) formula += ' + ' + bonus;
    }
    if (isHeal) {
        let isCustom = activityData.healing.custom.enabled;
        if (isCustom || isFormula) {
            if (formula?.toString()?.length) activityData.healing.custom = {
                enabled: true,
                formula: formula.toString()
            };
        } else {
            activityData.healing.number = number;
            activityData.healing.denomination = denomination;
            activityData.healing.bonus = bonus;
        }
        if (types.length) activityData.healing.types = new Set(types);
    } else {
        // Dealing with activities on weapons whose damage includes the base damage is a bit of a headache; we'll probably discover more cases
        // as time goes on that we'll want to account for, but this should be an okay start.
        if (activityData.damage.includeBase && !activityData.damage.parts[specificIndex]) {
            activityData.damage.includeBase = false;
            activityData.damage.parts[specificIndex] = {
                number: number,
                denomination: denomination,
                bonus: bonus + ' + @mod'
            };
        }
        else if (activityData.damage.parts[specificIndex]) {
            let isCustom = activityData.damage.parts[specificIndex].custom.enabled;
            if (isCustom || isFormula) {
                if (formula?.toString()?.length) activityData.damage.parts[specificIndex].custom = {
                    enabled: true,
                    formula: formula.toString()
                };
            } else {
                activityData.damage.parts[specificIndex].number = number;
                activityData.damage.parts[specificIndex].denomination = denomination;
                activityData.damage.parts[specificIndex].bonus = bonus;
            }
        }
        if (types.length) activityData.damage.parts[specificIndex].types = new Set(types);
    }
    return activityData;
}
function duplicateActivity(activity) {
    let newActivity = activity.clone();
    newActivity.prepareData();
    newActivity.prepareFinalData();
    return newActivity;
}
function getConditions(activity) {
    let conditions = new Set();
    activity.effects.forEach(i => {
        if (!i.effect) return;
        let effectConditions = effectUtils.getConditions(i.effect);
        effectConditions.forEach(j => conditions.add(j));
    });
    if (activity._otherActivity) conditions = conditions.union(getConditions(activity._otherActivity));
    return conditions;
}
function getMod(activity) {
    return activity.actor.system.abilities[activity.ability].mod;
}
function hasSave(activity) {
    if (activity.type === 'save') return true;
    if (activity._otherActivity) return hasSave(activity._otherActivity);
}
function isSpellActivity(activity) {
    let identifier = getIdentifier(activity);
    if (!identifier) {
        return genericUtils.getProperty(activity, 'midiProperties.automationOnly');
    }
    let spellActivities = itemUtils.getSpellActivities(activity.item) ?? [];
    return spellActivities.includes(identifier);
}
function canUse(activity) {
    if (!activity.consumption.targets.length) return true;
    let canUse = true;
    for (let i = 0; i < activity.consumption.targets.length; i++) {
        let test = rollUtils.rollDiceSync(activity.consumption.targets[i].value, {entity: activity, options: {minimize: true}}).total;
        switch (activity.consumption.targets[i].type) {
            case 'itemUses':
                if (activity.consumption.targets[i].target == '') {
                    canUse = activity.item.system.uses.value >= test;
                } else {
                    let item = activity.actor.items.get(activity.consumption.targets[i].target);
                    if (item) canUse = item.system.uses.value >= test;
                }
                break;
            case 'activityUses': canUse = activity.uses.value >= test;
        }
        if (!canUse) return false;
    }
    return true;
}
async function correctSpellLink(activity, spell) {
    return await genericUtils.update(activity, {'spell.uuid': spell.uuid});
}
function isHidden(activity) {
    if (activity.midiProperties.automationOnly) return true;
    let cprRiders = genericUtils.getProperty(activity.item, 'flags.chris-premades.hiddenActivities') ?? [];
    cprRiders = cprRiders.map(i => activityUtils.getActivityByIdentifier(activity.item, i)?.id).filter(i => i);
    return cprRiders.includes(activity.id);
}
export let activityUtils = {
    getActivityByIdentifier,
    getIdentifier,
    setIdentifier,
    withChangedDamage,
    duplicateActivity,
    getConditions,
    getMod,
    hasSave,
    isSpellActivity,
    canUse,
    correctSpellLink,
    isHidden
};