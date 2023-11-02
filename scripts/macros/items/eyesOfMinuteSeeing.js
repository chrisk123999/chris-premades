export function eyesOfMinuteSeeing(skillId, options) {
    return skillId != 'inv' ? false : {'label': 'This check relies on searching or studying and object.', 'type': 'advantage'};
}