import {compendiumUtils, constants, effectUtils, errors, genericUtils, workflowUtils} from '../../../utils.js';

async function damage({workflow}) {
    let damageRoll = await new CONFIG.Dice.DamageRoll('0', {}, {type: 'healing'}).evaluate();
    await workflow.setDamageRolls([damageRoll]);
}
async function late({workflow}) {
    let targetToken = workflow.targets.first() ?? workflow.token;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Potion of Poison: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.PotionOfPoison.Damage'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.damage.parts[0][0] = '3d6[poison]';
    let featureWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [targetToken]);
    if (!featureWorkflow.failedSaves.size) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.actor.uuid,
        flags: {
            dae: {
                showIcon: true
            },
            'chris-premades': {
                conditions: ['poisoned'],
                potionOfPoison: {
                    numDice: 3
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'combat', ['potionOfPoison']);
    await effectUtils.createEffect(targetToken.actor, effectData);
}
async function turnStart({trigger: {entity: effect, token}}) {
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Potion of Poison: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.PotionOfPoison.Damage'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let numDice = effect.flags['chris-premades'].potionOfPoison.numDice;
    let rollFormula = numDice + 'd6[poison]';
    featureData.system.damage.parts[0][0] = rollFormula;
    let featureWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, token.actor, [token]);
    if (featureWorkflow.failedSaves.size) return;
    if (numDice === 1) {
        await genericUtils.remove(effect);
        return;
    }
    await genericUtils.setFlag(effect, 'chris-premades', 'potionOfPoison.numDice', numDice - 1);
}
export let potionOfPoison = {
    name: 'Potion of Poison',
    version: '0.12.70',
    midi: {
        item: [
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
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};