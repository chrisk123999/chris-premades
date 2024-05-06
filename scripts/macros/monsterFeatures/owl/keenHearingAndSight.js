export function keenHearingAndSight(skillId, options) {
    return skillId != 'prc' ? false : {'label': 'This check relies hearing or sight.', 'type': 'advantage'};
}