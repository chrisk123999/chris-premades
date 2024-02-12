function initiate(skillId, options) {
    return skillId != 'ath' ? false : {'label': 'Attempting to initiate a grapple.', 'type': 'advantage'};
}
function escape(skillId, options) {
    return !['ath', 'acr'].includes(skillId) ? false : {'label': 'Attempting to escape a grapple.', 'type': 'advantage'};
    
}
export let grapple = {
    'escape': escape,
    'initiate': initiate
}