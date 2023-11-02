export function stoneCamouflage(skillId, options) {
    return skillId != 'ste' ? false : {'label': 'Hiding in rocky terrain?', 'type': 'advantage'};
}