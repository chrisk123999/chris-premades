import {activityUtils, automationUtils, constants, dialogUtils, documentUtils, itemUtils, workflowUtils} from '../../../../../proxy.mjs';
async function early({document, workflow}) {
    if (document.flags['chris-premades']?.overchannel?.active) return;
    if (workflow.workflowOptions['chris-premades']?.multiSingleTarget) return;
    if (workflow.item?.type !== 'spell') return;
    if (!workflow.activity.hasDamage && !workflow.item.flags.cat?.macros?.roll?.some(m => m.identifier === 'multiSingleTarget')) return;
    const spellLevel = workflowUtils.getCastLevel(workflow);
    const maxSpellLevel = automationUtils.getConfigValue(document, 'maxSpellLevel') ?? 5;
    if (!spellLevel || spellLevel > maxSpellLevel) return;
    const timesUsed = document.flags['chris-premades']?.overchannel?.timesUsed;
    let selection;
    if (timesUsed) {
        const dieSize = automationUtils.getConfigValue(document, 'backlashDieSize') ?? 'd12';
        const damageFormula = (spellLevel * (timesUsed + 1)) + dieSize;
        selection = await dialogUtils.confirm(document.name, _loc('CHRISPREMADES.Macros.Legacy.Overchannel.Damage', {itemName: document.name, damageFormula}));
    } else {
        selection = await dialogUtils.confirmUseItem(document);
    }
    if (!selection) return;
    workflowUtils.setWorkflowProperty(workflow, 'maxDamage', true);
    await documentUtils.setFlag(document, 'chris-premades', 'overchannel.active', true);
}
async function damage({document, workflow}) {
    if (!document.flags['chris-premades']?.overchannel?.active) return;  
    const damageRolls = await Promise.all(workflow.damageRolls.map(async roll => {
        const maxed = await roll.reroll({maximize: true});
        maxed.options.cat = {...(maxed.options.cat ?? {}), noManualRoll: true};
        return maxed;
    }));
    await workflow.setDamageRolls(damageRolls);
    workflowUtils.setWorkflowProperty(workflow, 'maxDamage', true);
}
async function late({document, workflow}) {
    if (document.uuid === workflow.item.uuid) return;
    if (!document.flags['chris-premades']?.overchannel?.active) return;
    if (workflow.workflowOptions['chris-premades']?.multiSingleTarget) return;
    const timesUsed = document.flags['chris-premades']?.overchannel?.timesUsed ?? 0;
    await documentUtils.update(document, {flags: {'chris-premades': {overchannel: {active: false, timesUsed: timesUsed + 1}}}});
    let numDice;
    if (timesUsed) numDice = workflowUtils.getCastLevel(workflow) * (timesUsed + 1);
    await workflowUtils.completeActivityUse(itemUtils.getActivityByIdentifier(document, 'overchannel'));
    if (!numDice) return;
    const feature = itemUtils.getActivityByIdentifier(document, 'overchannelDamage');
    if (!feature) return;
    const dieSize = automationUtils.getConfigValue(document, 'backlashDieSize') ?? 'd12';
    const damageType = automationUtils.getConfigValue(document, 'backlashDamageType') ?? 'necrotic';
    const activityData = activityUtils.getDamageModifiedActivityData(feature, {number: numDice, denomination: Number(dieSize.slice(1))}, {types: [damageType]});
    await workflowUtils.syntheticActivityDataRoll(activityData, document, [workflow.token.document]);
}
async function longRest({document}) {
    await documentUtils.setFlag(document, 'chris-premades', 'overchannel.timesUsed', 0);
}
export const overchannel = {
    name: 'Overchannel',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: early,
            priority: 200
        },
        {
            pass: 'actorDamageRoll',
            macro: damage,
            priority: 200
        },
        {
            pass: 'actorRollFinished',
            macro: late,
            priority: 200
        }
    ],
    rest: [
        {
            pass: 'actorLong',
            macro: longRest,
            priority: 50
        }
    ],
    config: {
        maxSpellLevel: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Config.MaxSpellLevel',
            category: 'homebrew'
        },
        backlashDamageType: {
            default: 'necrotic',
            type: 'select',
            get options() {
                return constants.damageTypeOptions();
            },
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'damage'
        },
        backlashDieSize: {
            default: 'd12',
            type: 'select',
            get options() {
                return constants.diceSizeOptions();
            },
            label: 'CHRISPREMADES.Config.DiceSize',
            category: 'damage'
        }
    }
};
