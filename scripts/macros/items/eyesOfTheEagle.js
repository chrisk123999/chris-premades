export function eyesOfTheEagle(skillId, options) {
    return skillId != 'prc' ? false : {'label': 'This check relies on sight.', 'type': 'advantage'};
}