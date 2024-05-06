export function keenSmell(skillId, options) {
    return skillId != 'prc' ? false : {'label': 'This check relies on smell.', 'type': 'advantage'};
}