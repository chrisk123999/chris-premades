import {combatUtils, dialogUtils, genericUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function late({workflow}) {
    let damageApplied = workflow.damageItem.damageDetail.reduce((acc, i) => acc + i.value, 0);
    await workflowUtils.applyDamage([workflow.token], damageApplied, 'healing');
}
async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let damageType = workflow.defaultDamageType;
    if (['healing', 'temphp'].includes(damageType)) return;
    if (workflow.item.uuid === item.uuid) return;
    if (!item.system.uses.value) return;
    if (!combatUtils.perTurnCheck(item, 'graspOfAvarice')) return;
    let targetToken = workflow.targets.first();
    if (tokenUtils.getDistance(workflow.token, targetToken) > 60) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await combatUtils.setTurnCheck(item, 'graspOfAvarice');
    await workflowUtils.syntheticItemRoll(item, [workflow.hitTargets.first()], {config: {consumeUsage: true}, options: {configureDialog: false}});
}
async function damageApplication({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size < 2) return;
    let damageType = workflow.defaultDamageType;
    if (['healing', 'temphp'].includes(damageType)) return;
    if (workflow.item.uuid === item.uuid) return;
    if (!item.system.uses.value) return;
    if (workflow.graspOfAvariceChoseNo) return;
    if (!combatUtils.perTurnCheck(item, 'graspOfAvarice')) return;
    let targetTokens = Array.from(workflow.hitTargets.filter(i => tokenUtils.getDistance(workflow.token, i) <= 60));
    if (!targetTokens.length) return;
    let selection = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), targetTokens);
    workflow.graspOfAvariceChoseNo = true;
    if (!selection) return;
    await combatUtils.setTurnCheck(item, 'graspOfAvarice');
    let targetToken = selection[0];
    await workflowUtils.syntheticItemRoll(item, [targetToken], {config: {consumeUsage: true}, options: {configureDialog: false}});
}
async function combatEnd({trigger: {entity: item}}) {
    await combatUtils.setTurnCheck(item, 'graspOfAvarice', true);
}
export let graspOfAvarice = {
    name: 'Baleful Scion: Grasp of Avarice',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            },
            {
                pass: 'applyDamage',
                macro: damageApplication,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ]
};