import {errors} from '../errors.js';
import {genericUtils} from './genericUtils.js';

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
    let existingIdentifier = identifiers.findIndex(i => i[1] === activity.id);
    if (existingIdentifier) identifiers.splice(existingIdentifier, 1);
    identifiers.push([identifier, activity.id]);
    await genericUtils.setFlag(item, 'chris-premades', 'activityIdentifiers', Object.fromEntries(identifiers));
}

// Currently this exists only for use immediately before using an activity
async function setDamage(activity, formula, types=[], {specificIndex = 0} = {}) {
    let isHeal = activity.type === 'heal';
    // let damagePart = activity.damage.parts[specificIndex].toObject();
    // damagePart.custom = {
    //     enabled: true,
    //     formula: formula.toString()
    // };
    // if (types.length) damagePart.types = types;
    // await genericUtils.update(activity, {'damage.parts': [damagePart]});
    // wtf is going on here
    if (isHeal) {
        if (formula?.toString()?.length) activity.healing.custom.formula = formula.toString();
        if (types.length) activity.healing.types = new Set(types);
    } else {
        if (formula?.toString()?.length) activity.damage.parts[specificIndex].custom.formula = formula.toString();
        if (types.length) activity.damage.parts[specificIndex].types = new Set(types);
    }
}
export let activityUtils = {
    getActivityByIdentifier,
    getIdentifier,
    setIdentifier,
    setDamage
};