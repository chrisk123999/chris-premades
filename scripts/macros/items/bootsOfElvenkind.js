export function bootsOfElvenkind(skillId, options) {
    return skillId != 'ste' ? false : {'label': 'This check relies on moving silently.', 'type': 'advantage'};
}