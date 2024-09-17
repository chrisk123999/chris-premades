import {combatUtils, dialogUtils, genericUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let damageType = workflow.defaultDamageType;
    if (['healing', 'temphp'].includes(damageType)) return;
    if (workflow.item.uuid === item.uuid) return;
    if (!item.system.uses.value) return;
    if (!combatUtils.perTurnCheck(item, 'stasisStrike')) return;
    let targetToken = workflow.targets.first();
    if (tokenUtils.getDistance(workflow.token, targetToken) > 60) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await combatUtils.setTurnCheck(item, 'stasisStrike');
    await workflowUtils.bonusDamage(workflow, '1d8[force]', {damageType: 'force'});
    await workflowUtils.completeItemUse(item, {consumeUsage: true}, {configureDialog: false});
}
async function damageApplication({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size < 2) return;
    let damageType = workflow.defaultDamageType;
    if (['healing', 'temphp'].includes(damageType)) return;
    if (workflow.item.uuid === item.uuid) return;
    if (!item.system.uses.value) return;
    if (workflow.stasisStrikeChoseNo) return;
    if (!combatUtils.perTurnCheck(item, 'stasisStrike')) return;
    let targetTokens = Array.from(workflow.hitTargets.filter(i => tokenUtils.getDistance(workflow.token, i) <= 60));
    if (!targetTokens.length) return;
    let selection = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), targetTokens);
    workflow.stasisStrikeChoseNo = true;
    if (!selection) return;
    await combatUtils.setTurnCheck(item, 'stasisStrike');
    let targetToken = selection[0];
    await genericUtils.update(item, {'system.uses.value': item.system.uses.value - 1});
    let tempItem = item.clone({'system.damage.parts': [
        [
            '1d8[force]',
            'force'
        ]
    ]});
    await workflowUtils.syntheticItemRoll(tempItem, [targetToken]);
}
async function combatEnd({trigger: {entity: item}}) {
    await combatUtils.setTurnCheck(item, 'stasisStrike', true);
}
export let stasisStrike = {
    name: 'Agent of Order: Stasis Strike',
    version: '0.12.70',
    midi: {
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