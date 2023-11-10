import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
export async function hiddenStep({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.item) return;
    if (!(constants.attacks.includes(workflow.item.actionType) || workflow.item.system.save.ability || workflow.damageRoll)) return;
    let effect = chris.findEffect(workflow.actor, 'Hidden Step');
    if (effect) await chris.removeEffect(effect);
}