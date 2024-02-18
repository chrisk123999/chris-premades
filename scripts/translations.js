function damageType(type) {
    return CONFIG.DND5E.damageTypes[type].label;
}
function healingType(type) {
    return CONFIG.DND5E.healingTypes[type].label.toLowerCase();
}
function skills(skill) {
    return CONFIG.DND5E.skills[skill].label;
}
function conditions(condition) {
    return CONFIG.DND5E.conditionTypes[condition].label;
}
export let translate = {
    'damageType': damageType,
    'healingType': healingType,
    'skills': skills,
    'conditions': conditions
}