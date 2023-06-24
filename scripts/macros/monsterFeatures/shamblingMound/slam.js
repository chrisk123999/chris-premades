import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
export async function slam({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let effect = chris.findEffect(workflow.targets.first().actor, 'Shambling Mound - Slam');
    if (!effect) return;
    let selection = await chris.dialog('Engulf target?', [['Yes', true], ['No', false]]);
    if (!selection) return;
    let engulfEffect = chris.findEffect(workflow.actor, 'SM - Engulf');
    if (!engulfEffect) return;
    let feature = await fromUuid(engulfEffect.origin);
    if (!feature) return;
    let options = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await MidiQOL.completeItemUse(feature, {}, options);
}