import {combatUtils, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    let inCombat = combatUtils.inCombat();
    if (!workflow.hitTargets.size || !itemUtils.getEquipmentState(item) || !item.system.uses.value || !workflow.damageRolls) return;
    if (workflow.item.type === 'spell') {
        if (workflowUtils.getCastLevel(workflow) != 0) return;
    } else {
        if (!workflow.item.flags['chris-premades']?.trueStrike) return;
    }
    let formula = itemUtils.getConfig(item, 'formula');
    if (workflow.targets.size === 1) {
        let selection = await dialogUtils.confirmUseItem(item);
        if (!selection) return;
        await workflowUtils.bonusDamage(workflow, formula);
        await workflowUtils.syntheticItemRoll(item, Array.from(workflow.targets), {consumeResources: inCombat, consumeUsage: inCombat});
    } else if (workflow.targets.size > 1) {
        let result = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), workflow.targets, {skipDeadAndUnconscious: false});
        if (!result) return;
        let damageRoll = await new CONFIG.Dice.DamageRoll(formula, {}, {type: workflow.defaultDamageType}).evaluate();
        damageRoll.toMessage({
            rollMode: 'roll',
            speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
            flavor: item.name
        });
        genericUtils.setProperty(workflow, 'chris-premades.wandOfThePrecociousApprentice', {target: result[0].document.uuid, damage: damageRoll.total});
        await workflowUtils.syntheticItemRoll(item, [result[0]], {consumeResources: inCombat, consumeUsage: inCombat});
    }
}
async function applyDamage({trigger, workflow, ditem}) {
    if (!workflow['chris-premades']?.wandOfThePrecociousApprentice) return;
    let {target, damage} = workflow['chris-premades'].wandOfThePrecociousApprentice;
    if (target !== ditem.targetUuid || !damage) return;
    ditem.rawDamageDetail[0].value += damage;
    let modifiedTotal = damage * (ditem.damageDetail[0].active.multiplier ?? 1);
    ditem.damageDetail[0].value += modifiedTotal;
    ditem.hpDamage += modifiedTotal;
}
export let wandOfThePrecociousApprentice = {
    name: 'Wand of the Precocious Apprentice',
    version: '1.4.25',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            },
            {
                pass: 'applyDamage',
                macro: applyDamage,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '1d4',
            category: 'homebrew',
            homebrew: true
        }
    ]
};