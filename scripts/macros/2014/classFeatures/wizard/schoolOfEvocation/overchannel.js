import {activityUtils, dialogUtils, genericUtils, workflowUtils} from '../../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.item.type !== 'spell') return;
    let spellLevel = workflowUtils.getCastLevel(workflow);
    if (!spellLevel || spellLevel > 5) return;
    let timesUsed = item.flags['chris-premades'].overchannel?.timesUsed;
    let damageFormula;
    if (timesUsed) damageFormula = (spellLevel * (timesUsed + 1)) + 'd12';
    let confirmText;
    if (damageFormula) {
        confirmText = genericUtils.format('CHRISPREMADES.Macros.Overchannel.Damage', {itemName: item.name, damageFormula});
    } else {
        confirmText = genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name});
    }
    let selection = await dialogUtils.confirm(item.name, confirmText);
    if (!selection) return;
    let damageRolls = await Promise.all(workflow.damageRolls.map(async roll => {
        return await roll.reroll({maximize: true});
    }));
    await workflow.setDamageRolls(damageRolls);
    await genericUtils.setFlag(item, 'chris-premades', 'overchannel.active', true);
}
async function late({trigger: {entity: item}, workflow}) {
    if (!item.flags['chris-premades'].overchannel?.active) return;
    await genericUtils.setFlag(item, 'chris-premades', 'overchannel.active', false);
    let timesUsed = item.flags['chris-premades'].overchannel?.timesUsed ?? 0;
    let numDice;
    if (timesUsed) numDice = workflowUtils.getCastLevel(workflow) * (timesUsed + 1);
    await workflowUtils.completeItemUse(item);
    await genericUtils.setFlag(item, 'chris-premades', 'overchannel.timesUsed', timesUsed + 1);
    if (!numDice) return;
    let feature = activityUtils.getActivityByIdentifier(item, 'overchannelDamage', {strict: true});
    if (!feature) return;
    let activityData = activityUtils.withChangedDamage(feature, {number: numDice, denomination: 12}, ['none']);
    await workflowUtils.syntheticActivityDataRoll(activityData, item, item.actor, [workflow.token]);
}
async function longRest({trigger: {entity: item}}) {
    await genericUtils.setFlag(item, 'chris-premades', 'overchannel.timesUsed', 0);
}
export let overchannel = {
    name: 'Overchannel',
    version: '1.1.10',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    rest: [
        {
            pass: 'long',
            macro: longRest,
            priority: 50
        }
    ],
    ddbi: {
        correctedItems: {
            Overchannel: {
                system: {
                    uses: {
                        per: null,
                        recovery: '',
                        value: null
                    },
                    consume: {
                        amount: null,
                        target: '',
                        type: ''
                    }
                }
            }
        }
    }
};