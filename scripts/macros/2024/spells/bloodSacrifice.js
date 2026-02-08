import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
import {constants, effectUtils} from '../../../utils.js';
async function damage({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageRolls) return;
    if (workflow.item.type != 'spell' && !workflow.item.flags['chris-premades']?.trueStrike) return;
    let item = await effectUtils.getOriginItem(effect);
    if (!item) return;
    let dieSize = itemUtils.getConfig(item, 'dieSize');
    let formula = (effect.flags['midi-qol'].castData.castLevel - 1) + dieSize;
    if (workflow.targets.size === 1) {
        await workflowUtils.bonusDamage(workflow, formula);
    } else if (workflow.targets.size > 1) {
        let result = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Macros.BloodSacrifice.Apply', {itemName: item.name}), workflow.targets, {skipDeadAndUnconscious: false});
        if (!result) return;
        let damageRoll = await new CONFIG.Dice.DamageRoll(formula, {}, {type: workflow.defaultDamageType}).evaluate();
        damageRoll.toMessage({
            rollMode: 'roll',
            speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
            flavor: item.name
        });
        genericUtils.setProperty(workflow, 'chris-premades.bloodSacrifice', {target: result[0].document.uuid, damage: damageRoll.total});
    }
}
async function applyDamage({trigger, workflow, ditem}) {
    if (!workflow['chris-premades']?.bloodSacrifice) return;
    let {target, damage} = workflow['chris-premades'].bloodSacrifice;
    if (target !== ditem.targetUuid || !damage) return;
    ditem.rawDamageDetail[0].value += damage;
    let modifiedTotal = damage * (ditem.damageDetail[0].active.multiplier ?? 1);
    ditem.damageDetail[0].value += modifiedTotal;
    ditem.hpDamage += modifiedTotal;
}
export let bloodSacrifice = {
    name: 'Blood Sacrifice',
    version: '1.4.25',
    rules: 'modern',
    config: [
        {
            value: 'dieSize',
            label: 'CHRISPREMADES.Config.DiceSize',
            type: 'select',
            options: constants.diceSizeOptions,
            default: 'd6',
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let bloodSacrificeEffect = {
    name: 'Blood Sacrifice: Effect',
    version: bloodSacrifice.version,
    rules: bloodSacrifice.rules,
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
    }
};