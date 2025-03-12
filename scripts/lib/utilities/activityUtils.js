import {errors} from '../errors.js';
import {effectUtils} from './effectUtils.js';
import {genericUtils} from './genericUtils.js';
import {itemUtils} from './itemUtils.js';
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
export let activityUtils = {
    getActivityByIdentifier,
    getIdentifier,
    setIdentifier,
    withChangedDamage,
    duplicateActivity,
    getConditions,
    hasSave,
    isSpellActivity
};