import {chris} from '../../../helperFunctions.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let feature = chris.getItem(workflow.actor, 'Light Sensitivity');
    if (!feature || !workflow.token) return;
    if (!chris.getConfiguration(feature, 'enabled')) return;
    if (chris.checkLight(workflow.token) === 'bright') {
        workflow.disadvantage = true;
        workflow.attackAdvAttribution.add('Disadvantage: ' + feature.name);
    }
}
function perception(skillId, options) {
    return skillId != 'prc' ? false : {'label': 'This check relies on sight while in bright light.', 'type': 'disadvantage'};
}
export let lightSensitivity = {
    'attack': attack,
    'perception': perception
}