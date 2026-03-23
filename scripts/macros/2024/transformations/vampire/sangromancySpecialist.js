import {dialogUtils, genericUtils, itemUtils, workflowUtils, constants} from '../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflow.item.type === 'spell') {
        if (workflowUtils.getCastLevel(workflow) != 0) return;
    } else {
        if (!workflow.item.flags['chris-premades']?.trueStrike) return;
    }
    let damageTypes = workflowUtils.getDamageTypes(workflow.damageRolls);
    if (!damageTypes.has('necrotic')) return;
    let formula = '';
    let max = itemUtils.getConfig(item, 'max');
    if (!max) return;
    let hitDieSelection = await dialogUtils.selectHitDie(workflow.actor, item.name, '', {max, sangromancy: true});
    if (!hitDieSelection) return;
    let total = 0;
    for (let i of hitDieSelection) {
        if (!i.amount) continue;
        if (i.document.type === 'class') {
            formula += formula.length ? ' + ' + i.amount + i.document.system.hd.denomination : i.amount + i.document.system.hd.denomination;
        } else {
            let dieSize = itemUtils.getConfig(i.document, 'diceSize');
            if (!dieSize) continue;
            formula += formula.length ? ' + ' + i.amount + dieSize : i.amount + dieSize;
        }
        total += i.amount;
    }
    if (!total) return;
    for (let i of hitDieSelection) {
        if (!i.amount) continue;
        if (i.document.type === 'class') {
            await genericUtils.update(i.document, {'system.hd.spent': i.document.system.hd.spent + i.amount});
        } else {
            await genericUtils.update(i.document, {'system.uses.spent': i.document.system.uses.spent + i.amount});
        }
    }
    let damageType = itemUtils.getConfig(item, 'damageType');
    await workflowUtils.bonusDamage(workflow, formula, {damageType});
    await workflowUtils.syntheticItemRoll(item, Array.from(workflow.targets));
}
export let sangromancySpecialist = {
    name: 'Stage 3 Boon: Sangromancy Specialist',
    version: '1.5.11',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 501
            }
        ]
    },
    config: [
        {
            value: 'diceSize',
            label: 'CHRISPREMADES.Config.DiceSize',
            type: 'select',
            default: 'd12',
            options: constants.diceSizeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'necrotic',
            category: 'homebrew',
            homebrew: true,
            options: constants.damageTypeOptions
        },
        {
            value: 'max',
            label: 'CHRISPREMADES.Config.Max',
            type: 'number',
            default: 2,
            category: 'homebrew',
            homebrew: true
        }
    ]
};