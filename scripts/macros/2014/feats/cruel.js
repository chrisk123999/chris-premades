import {activityUtils, combatUtils, dialogUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    let activity = activityUtils.getActivityByIdentifier(item, 'damage', {strict: true});
    if (!activity) return;
    if (!workflow.hitTargets.size || !workflow.damageRolls || !item.system.uses.value || !activity.uses.value || workflow.defaultDamageType === 'healing' || workflow.defaultDamageType === 'temphp') return;
    let formula = itemUtils.getConfig(item, 'formula');
    let canCrit = itemUtils.getConfig(item, 'canCrit');
    let used = false;
    if (workflow.targets.size === 1) {
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name + ': ' + activity.name}));
        if (!selection) return;
        await workflowUtils.bonusDamage(workflow, formula, {ignoreCrit: !canCrit});
        used = true;
    } else {
        let result = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name + ': ' + activity.name}), workflow.targets, {skipDeadAndUnconscious: false});
        if (!result) return;
        let damageRoll = await new CONFIG.Dice.DamageRoll(formula, {}, {type: workflow.defaultDamageType}).evaluate();
        damageRoll.toMessage({
            rollMode: 'roll',
            speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
            flavor: item.name
        });
        genericUtils.setProperty(workflow, 'chris-premades.cruel', {target: result[0].document.uuid, damage: damageRoll.total});
        used = true;
    }
    if (!used) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.targets.first()]);
    await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
    if (!combatUtils.inCombat()) return;
    let damage = activityUtils.getActivityByIdentifier(item, 'damage', {strict: true});
    if (damage) await genericUtils.update(damage, {'uses.spent': damage.uses.spent + 1});
    let intimidation = activityUtils.getActivityByIdentifier(item, 'intimidation', {strict: true});
    if (intimidation) await genericUtils.update(intimidation, {'uses.spent': intimidation.uses.spent + 1});
    let heal = activityUtils.getActivityByIdentifier(item, 'heal', {strict: true});
    if (heal) await genericUtils.update(heal, {'uses.spent': heal.uses.spent + 1});
}
async function applyDamage({trigger, workflow, ditem}) {
    if (!workflow['chris-premades']?.cruel) return;
    let {target, damage} = workflow['chris-premades'].cruel;
    if (target !== ditem.targetUuid || !damage) return;
    ditem.rawDamageDetail[0].value += damage;
    let modifiedTotal = damage * (ditem.damageDetail[0].active.multiplier ?? 1);
    ditem.damageDetail[0].value += modifiedTotal;
    ditem.hpDamage += modifiedTotal;
}
async function critical({trigger: {entity: item}, workflow}) {
    let activity = activityUtils.getActivityByIdentifier(item, 'heal', {strict: true});
    if (!activity) return;
    if (!workflowUtils.isAttackType(workflow, 'attack') || !workflow.isCritical || !item.system.uses.value || !activity.uses.value) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name + ': ' + activity.name}));
    if (!selection) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.token]);
    await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
    if (!combatUtils.inCombat()) return;
    let damage = activityUtils.getActivityByIdentifier(item, 'damage', {strict: true});
    if (damage) await genericUtils.update(damage, {'uses.spent': damage.uses.spent + 1});
    let intimidation = activityUtils.getActivityByIdentifier(item, 'intimidation', {strict: true});
    if (intimidation) await genericUtils.update(intimidation, {'uses.spent': intimidation.uses.spent + 1});
    let heal = activityUtils.getActivityByIdentifier(item, 'heal', {strict: true});
    if (heal) await genericUtils.update(heal, {'uses.spent': heal.uses.spent + 1});
}
async function check({trigger: {entity: item, roll, actor, options, skillId}}) {
    if (skillId != 'itm') return;
    let activity = activityUtils.getActivityByIdentifier(item, 'intimidation', {strict: true});
    if (!activity) return;
    if (!item.system.uses.value || !activity.uses.value) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name + ': ' + activity.name}));
    if (!selection) return;
    let workflow = await workflowUtils.syntheticActivityRoll(activity, []);
    await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
    if (combatUtils.inCombat()) {
        let damage = activityUtils.getActivityByIdentifier(item, 'damage', {strict: true});
        if (damage) await genericUtils.update(damage, {'uses.spent': damage.uses.spent + 1});
        let intimidation = activityUtils.getActivityByIdentifier(item, 'intimidation', {strict: true});
        if (intimidation) await genericUtils.update(intimidation, {'uses.spent': intimidation.uses.spent + 1});
        let heal = activityUtils.getActivityByIdentifier(item, 'heal', {strict: true});
        if (heal) await genericUtils.update(heal, {'uses.spent': heal.uses.spent + 1});
    }
    return await rollUtils.addToRoll(roll, String(workflow.utilityRolls[0].total));
}
export let cruel = {
    name: 'Cruel',
    version: '1.5.23',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 150
            },
            {
                pass: 'applyDamage',
                macro: applyDamage,
                priority: 150
            },
            {
                pass: 'rollFinished',
                macro: critical,
                priority: 150
            }
        ]
    },
    skill: [
        {
            pass: 'bonus',
            macro: check,
            priority: 50
        }
    ],
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '1d6',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'canCrit',
            label: 'CHRISPREMADES.Config.CanCrit',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        }
    ]
};