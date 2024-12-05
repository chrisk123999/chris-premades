import {dialogUtils, genericUtils, socketUtils, workflowUtils} from '../../../../utils.js';

async function damageApplication({trigger: {entity: item, token}, workflow, ditem}) {
    if (ditem.newHP > 0 || ditem.oldHP === 0) return;
    if (!item.system.uses.value) return;
    if (workflow.isCritical || workflowUtils.getDamageTypes(workflow.damageRolls).has('radiant')) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), {userId: socketUtils.firstOwner(token.actor, true)});
    if (!selection) return;
    let damageDealt = ditem.damageDetail.reduce((acc, i) => acc + (i.value * (i.active.multiplier ?? 1)), 0);
    let featureData = genericUtils.duplicate(item.toObject());
    let activityId = Object.keys(featureData.system.activities)[0];
    featureData.system.activities[activityId].save.dc.value += damageDealt;
    featureData.system.activities[activityId].save.dc.formula += ' + ' + damageDealt;
    let featureWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, token.actor, [token], {config: {consumeUsage: true}});
    if (featureWorkflow.failedSaves.size) return;
    let newDamageTotal = ditem.oldHP - 1;
    ditem.damageDetail = [{type: ditem.damageDetail[0].type, value: newDamageTotal, active: {multiplier: 1}}];
    ditem.hpDamage = newDamageTotal;
}
export let strengthOfTheGrave = {
    name: 'Strength of the Grave',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 250
            }
        ]
    }
};