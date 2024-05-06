export function keenHearingAndSmell(skillId, options) {
    return skillId != 'prc' ? false : {'label': 'This check relies hearing or smell.', 'type': 'advantage'};
}