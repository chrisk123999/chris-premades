import {actorUtils, dialogUtils, documentUtils, effectUtils, genericUtils} from '../../../../../proxy.mjs';
import utils from '../../../../../utils.mjs';
async function use({document, workflow}) {
    const sourceEffects = document.item.effects.filter(effect => !effect.transfer);
    if (!sourceEffects.length) return;
    const available = actorUtils.getItemByIdentifier(workflow.actor, 'font-of-magic')?.system.uses.value ?? 0;
    if (!available) {
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.RevelationInFlesh.NotEnough', {type: 'info'});
        return;
    }
    const selection = await dialogUtils.selectDocumentDialog(document.item.name, _loc('CHRISPREMADES.Macros.Legacy.RevelationInFlesh.Select'), sourceEffects, {
        max: Math.min(available, sourceEffects.length),
        checkbox: true,
        sort: 'alphabetical'
    });
    if (!selection) return;
    const chosen = selection.filter(entry => entry.amount).map(entry => entry.document);
    if (!chosen.length) return;
    await utils.spendScaledCost(document.item, 'revelation-in-flesh-cost', chosen.length);
    const effectData = documentUtils.getEffectData(workflow.activity, chosen[0].id, {activityUuid: workflow.activity.uuid});
    effectData.name = document.item.name;
    effectData.img = document.item.img;
    chosen.slice(1).forEach(effect => effectData.system.changes.push(...effect.toObject().system.changes));
    utils.pushImageChanges(effectData, document);
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
export const revelationInFlesh = {
    name: 'Revelation in Flesh',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'activityRollFinished', macro: use, priority: 50}
    ],
    config: {
        ...utils.imageConfig
    }
};
