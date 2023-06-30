import {chris} from '../../../helperFunctions.js';
import {constants} from '../../../constants.js';
async function onHit(workflow, targetToken) {
    console.log(workflow);
    if (!workflow.damageRoll || !workflow.hitTargets.has(targetToken)) return;
    let effect = chris.findEffect(targetToken.actor, 'Regeneration');
    if (!effect) return;
    let effect2 = chris.findEffect(targetToken.actor, 'Regeneration Blocked');
    if (effect2) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let stopHeal = false;
    for (let i of Object.keys(CONFIG.DND5E.damageTypes).filter(i => i != 'midi-none')) {
        if (chris.getConfiguration(originItem, i) && chris.getRollDamageTypes(workflow.damageRoll).has(i) && !chris.checkTrait(targetToken.actor, 'di', i)) {
            stopHeal = true;
            break;
        }
    }
    if (!stopHeal) {
        if (chris.getConfiguration(originItem, 'zeroHP')) return;
        if (targetToken.actor.system.attributes.hp.value === 0) {
            console.log('Is defeated!');
        }
        return;
    }
    let effectData = {
        'label': 'Regeneration Blocked',
        'icon': originItem.img,
        'duration': {
            'seconds': 12
        },
        'origin': originItem.uuid
    };
    await chris.createEffect(targetToken.actor, effectData);
}
async function turnStart(token, origin) {
    let hp = token.actor.system.attributes.hp.value;
    if (chris.checkTrait(token.actor, 'di', 'healing')) return;
    let effect2 = chris.findEffect(token.actor, 'Regeneration Blocked');
    if (effect2) {
        if (hp != 0) await chris.removeEffect(effect2);
        return;
    }
    if (chris.getConfiguration(origin, 'zeroHP') && hp === 0) return;
    let featureData = duplicate(origin.toObject());
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': token.actor});
    let options = constants.syntheticItemWorkflowOptions([token.document.uuid]);
    setProperty(options, 'workflowOptions.allowIncapacitated', true);
    await MidiQOL.completeItemUse(feature, {}, options);
}
export let regeneration = {
    'onHit': onHit,
    'turnStart': turnStart
}