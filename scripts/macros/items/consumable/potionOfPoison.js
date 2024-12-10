import {activityUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, workflowUtils} from '../../../utils.js';

async function damage({workflow}) {
    let damageRoll = await new CONFIG.Dice.DamageRoll('0', {}, {type: 'healing'}).evaluate();
    await workflow.setDamageRolls([damageRoll]);
}
async function late({workflow}) {
    let targetToken = workflow.targets.first() ?? workflow.token;
    let feature = await activityUtils.getActivityByIdentifier(workflow.item, 'potionOfPoisonDamage', {strict: true});
    if (!feature) return;
    await activityUtils.setDamage(feature, '3d6[poison]', ['poison']);
    let featureWorkflow = await workflowUtils.syntheticActivityRoll(feature, [targetToken]);
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
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(effect.origin), 'potionOfPoisonDamage', {strict: true});
    if (!feature) return;
    let numDice = effect.flags['chris-premades'].potionOfPoison.numDice;
    let rollFormula = numDice + 'd6[poison]';
    await activityUtils.setDamage(feature, rollFormula, ['poison']);
    let featureWorkflow = await workflowUtils.syntheticActivityRoll(feature, [token]);
    if (featureWorkflow.failedSaves.size) return;
    if (numDice === 1) {
        await genericUtils.remove(effect);
        return;
    }
    await genericUtils.setFlag(effect, 'chris-premades', 'potionOfPoison.numDice', numDice - 1);
}
export let potionOfPoison = {
    name: 'Potion of Poison',
    version: '1.1.0',
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
                priority: 50,
                activities: ['potionOfPoison']
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