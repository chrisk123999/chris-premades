import {actorUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetActor = workflow.targets.first().actor;
    let dead = effectUtils.getEffectByStatusID(targetActor, 'dead');
    if (dead) return;
    let unconscious = effectUtils.getEffectByStatusID(targetActor, 'unconscious');
    if (!unconscious) return;
    let roll = await workflow.actor.rollSkill({skill: 'med'});
    if (roll[0].total < 10 || !workflow.targets.size) return;
    let remarkableRecovery = itemUtils.getItemByIdentifier(targetActor, 'remarkableRecovery');
    if (!remarkableRecovery) {
        await genericUtils.update(targetActor, {'system.attributes.death.success': 0, 'system.attributes.death.failure': 0});
        let effectData = {
            name: genericUtils.translate('CHRISPREMADES.Macros.Stabilize.Stabilized'),
            img: workflow.item.img,
            origin: workflow.item.uuid,
            flags: {
                dae: {
                    specialDuration: [
                        'isHealed',
                        'isDamaged'
                    ],
                    showIcon: true
                }
            }
        };
        await effectUtils.createEffect(targetActor, effectData);
        await rollUtils.rollDice('1d4[' + genericUtils.translate('DND5E.TimeHour') + ']', {chatMessage: true, mode: 'blindroll', flavor: genericUtils.translate('CHRISPREMADES.Macros.Stabilize.WakeUp')});
    } else {
        await workflowUtils.syntheticItemRoll(remarkableRecovery, [workflow.targets.first()]);
    }
}
export let stabilize = {
    name: 'Stabilize',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};