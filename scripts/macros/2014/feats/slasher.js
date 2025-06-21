import {combatUtils, constants, dialogUtils, effectUtils, genericUtils, workflowUtils} from '../../../utils.js';
async function lateSpeed({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1 || !workflow.damageRoll || !constants.attacks.includes(workflow.activity.actionType)) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('slashing')) return;
    if (!combatUtils.perTurnCheck(item, 'slasher')) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await combatUtils.setTurnCheck(item, 'slasher');
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        duration: {
            rounds: 2
        },
        changes: [
            {
                key: 'system.attributes.movement.all',
                mode: 0,
                value: genericUtils.handleMetric(-10),
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: ['turnStartSource']
            }
        }
    };
    await effectUtils.createEffect(workflow.targets.first().actor, effectData);
}
async function lateCrit({trigger: {entity: item}, workflow}) {
    if (!workflow.isCritical) return;
    if (workflow.hitTargets.size !== 1 || !workflow.damageRoll || !constants.attacks.includes(workflow.activity.actionType)) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('slashing')) return;
    let effectData = {
        name: item.name + ': ' + genericUtils.translate('DND5E.Critical'),
        img: item.img,
        origin: item.uuid,
        duration: {
            rounds: 2
        },
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: ['turnStartSource']
            }
        }
    };
    await effectUtils.createEffect(workflow.targets.first().actor, effectData);
    await item.displayCard();
}
export let slasher = {
    name: 'Slasher',
    version: '1.1.42',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: lateSpeed,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: lateCrit,
                priority: 50
            }
        ]
    }
};