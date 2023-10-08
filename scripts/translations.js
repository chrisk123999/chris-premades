function damageType(type) {
    return CONFIG.DND5E.damageTypes[type].toLowerCase();
}
function healingType(type) {
    return CONFIG.DND5E.healingTypes[type].toLowerCase();
}
function skills(skill) {
    return CONFIG.DND5E.skills[skill].label;
}
export let translate = {
    'damageType': damageType,
    'healingType': healingType,
    'skills': skills
}