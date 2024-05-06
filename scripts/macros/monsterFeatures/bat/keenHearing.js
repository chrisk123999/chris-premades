export function keenHearing(skillId, options) {
    return skillId != 'prc' ? false : {'label': 'This check relies hearing.', 'type': 'advantage'};
}