function damageType(type) {
    return CONFIG.DND5E.damageTypes[type].toLowerCase();
}
export let translate = {
    'damageType': damageType
}