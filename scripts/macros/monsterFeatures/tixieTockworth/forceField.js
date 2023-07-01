import {chris} from '../../../helperFunctions.js';
import {constants} from '../../../constants.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    await chris.removeCondition(workflow.actor, 'Grappled');
    await chris.removeCondition(workflow.actor, 'Restrained');
    await chris.removeCondition(workflow.actor, 'Stunned');
}
async function turnStart(token, origin) {
    if (token.actor.system.attributes.hp.value === 0) return;
    let featureData = duplicate(origin.toObject());
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': token.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([token.document.uuid]);
    await MidiQOL.completeItemUse(feature, config, options);
}
async function onHit(workflow, targetToken) {
    if (!workflow.damageRoll || targetToken.actor.system.attributes.hp.temp > 0) return;
    let effect = chris.findEffect(targetToken.actor, 'Force Field');
    if (!effect) return;
    await chris.removeEffect(effect);
}
export let forceField = {
    'item': item,
    'turnStart': turnStart,
    'onHit': onHit
}