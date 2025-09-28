import {activityUtils, dialogUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function damageApplication({trigger: {entity: item, token}, ditem}) {
    if (!ditem.isHit || ditem.newHP != 0 || ditem.oldHP === 0 || !itemUtils.canUse(item)) return;
    let targets = tokenUtils.findNearby(token, 30, 'enemy', {includeIncapacitated: true});
    if (!targets.length) return;
    let balefulInterdict = itemUtils.getItemByIdentifier(token.actor, 'balefulInterdict');
    if (!balefulInterdict) return;
    let buttons = [1, 2, 3].filter(i => i <= balefulInterdict.system.uses.value).map(i => [genericUtils.format('CHRISPREMADES.Macros.LastWord.Use', {amount: i}), i]);
    buttons.push(['CHRISPREMADES.Generic.No', false]);
    let selection = await dialogUtils.buttonDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), buttons, {displayAsRows: true, userId: socketUtils.firstOwner(item.actor, true)});
    if (!selection) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'use', {strict: true});
    if (!activity) return;
    let targetWorkflow = await workflowUtils.syntheticActivityRoll(item, targets, {consumeResources: true, consumeUsage: true, config: {scaling: Number(selection) - 1}});
    let tookDamage = targetWorkflow.damageList.find(i => i.totalDamage);
    if (!tookDamage) return;
    ditem.totalDamage = ditem.oldHP - targetWorkflow.damageTotal;
    ditem.newHP = targetWorkflow.damageTotal;
    ditem.newTempHP = 0;
    ditem.hpDamage = ditem.totalDamage;
    ditem.damageDetail.forEach(i => i.value = 0);
    ditem.damageDetail[0].value = ditem.totalDamage;
}
async function added({trigger: {entity: item}}) {
    await itemUtils.multiCorrectActivityItemConsumption(item, ['use'], {
        0: 'balefulInterdict',
        1: 'interdictBoons'
    });
}
export let interdictBoonLastWord = {
    name: 'Interdict Boons: Last Word',
    version: '1.7.77',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ]
};