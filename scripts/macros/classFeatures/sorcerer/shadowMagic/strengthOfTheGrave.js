import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
export async function strengthOfTheGrave(token, {item, workflow, ditem}) {
    if (ditem.newHP != 0 || ditem.oldHP === 0) return;
    let tokenActor = token.actor;
    let effect = chris.findEffect(tokenActor, 'Strength of the Grave');
    if (!effect) return;
    if (workflow.isCritical || chris.checkTrait(tokenActor, 'di', 'healing') || chris.totalDamageType(tokenActor, ditem.damageDetail[0], 'radiant') > 0 || chris.totalDamageType(tokenActor, ditem.damageDetail[0], 'none')) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    if (originItem.system.uses === 0) return;
    let selection = await chris.dialog('Use Strength of the Grave?', [['Yes', true], ['No', false]]);
    if (!selection || selection === false) return;
    let queueSetup = await queue.setup(workflow.uuid, 'strengthOfTheGrave', 389);
    if (!queueSetup) return;
    let featureData = duplicate(originItem.toObject());
    let damageDealt = ditem.appliedDamage;
    featureData.system.save.dc = damageDealt + featureData.system.save.dc;
    let feature = new CONFIG.Item.documentClass(featureData, {parent: tokenActor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [token.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeQuantity': false,
        'consumeUsage': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
    let featureWorkflow = await MidiQOL.completeItemUse(feature, {}, options);
    await originItem.update({
        'system.uses.value': originItem.system.uses.value -1
    });
    if (featureWorkflow.failedSaves.size === 1) {
        queue.remove(workflow.uuid);
        return;
    }
    ditem.newHP = 1;
    ditem.hpDamage = Math.abs(ditem.newHP - ditem.oldHP);
    queue.remove(workflow.uuid);
}