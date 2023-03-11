import {chris} from '../../../helperFunctions.js';
export async function undeadFortitude(targetToken, {workflow, ditem}) {
    if (ditem.newHP != 0) return;
    let targetActor = targetToken.actor;
    if (!targetActor.flags['chris-premades']?.feature?.undeadFortitude) return;
    if (workflow.isCritical || chris.checkTrait(targetActor, 'di', 'healing') || chris.totalDamageType(targetActor, ditem.damageDetail[0], 'radiant') > 0 || chris.totalDamageType(targetActor, ditem.damageDetail[0], 'none')) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let featureData = duplicate(originItem.toObject());
    let damageDealt = ditem.appliedDamage;
    featureData.system.save.dc = damageDealt + featureData.system.save.dc;
    let feature = new CONFIG.Item.documentClass(featureData, {parent: targetActor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetToken.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    let featureWorkflow = await MidiQOL.completeItemUse(feature, {}, options);
    if (featureWorkflow.failedSaves.size === 1) return;
    ditem.newHP = 1;
    ditem.hpDamage = Math.abs(ditem.newHP - ditem.oldHP);
}