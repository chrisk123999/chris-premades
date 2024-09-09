import {compendiumUtils, constants, dialogUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (!workflow.spellLevel || workflow.spellLevel > 5) return;
    let timesUsed = item.flags['chris-premades'].overchannel?.timesUsed;
    let damageFormula;
    if (timesUsed) damageFormula = (workflow.spellLevel * (timesUsed + 1)) + 'd12';
    let confirmText;
    if (damageFormula) {
        confirmText = genericUtils.format('CHRISPREMADES.Macros.Overchannel.Damage', {itemName: item.name, damageFormula});
    } else {
        confirmText = genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name});
    }
    let selection = await dialogUtils.confirm(item.name, confirmText);
    if (!selection) return;
    for (let damageRoll of workflow.damageRolls) {
        for (let term of damageRoll.terms) {
            for (let i = 0; i < term.values.length; i++) {
                term.results[i].result = term.faces;
            }
        }
    }
    await workflow.setDamageRolls(workflow.damageRolls);
    await genericUtils.setFlag(item, 'chris-premades', 'overchannel.active', true);
}
async function late({trigger: {entity: item}, workflow}) {
    if (!item.flags['chris-premades'].overchannel?.active) return;
    await genericUtils.setFlag(item, 'chris-premades', 'overchannel.active', false);
    let timesUsed = item.flags['chris-premades'].overchannel?.timesUsed ?? 0;
    let damageFormula;
    if (timesUsed) damageFormula = (workflow.spellLevel * (timesUsed + 1)) + 'd12';
    await item.use();
    await genericUtils.setFlag(item, 'chris-premades', 'overchannel.timesUsed', timesUsed + 1);
    if (!damageFormula) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Overchannel: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Overchannel.DamageItem'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.damage.parts = [
        [damageFormula, 'none']
    ];
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [workflow.token]);
}
async function longRest({trigger: {entity: item}}) {
    await genericUtils.setFlag(item, 'chris-premades', 'overchannel.timesUsed', 0);
}
export let overchannel = {
    name: 'Overchannel',
    version: '0.12.62',
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