export function keenSenses(skillId, options) {
    return skillId != 'prc' ? false : {'label': 'This check relies sight, hearing, or small.', 'type': 'advantage'};
}