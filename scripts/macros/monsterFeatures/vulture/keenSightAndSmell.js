export function keenSightAndSmell(skillId, options) {
    return skillId != 'prc' ? false : {'label': 'This check relies sight or smell.', 'type': 'advantage'};
}