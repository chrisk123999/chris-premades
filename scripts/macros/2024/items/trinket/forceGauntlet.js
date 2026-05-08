import {actorUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!itemUtils.getEquipmentState(item) || !item.system.uses.value || !workflow.hitTargets.size || !workflowUtils.isAttackType(workflow, 'meleeAttack') || !workflow.token) return;
    let selection = await dialogUtils.confirmUseItem(item);
    if (!selection) return;
    let formula = itemUtils.getConfig(item, 'formula');
    let damageType = itemUtils.getConfig(item, 'damageType');
    await workflowUtils.bonusDamage(workflow, formula, {damageType});
    genericUtils.setProperty(workflow, 'chris-premades.forceGauntlet', true);
}
async function used({trigger: {entity: item}, workflow}) {
    if ( !workflow['chris-premades']?.forceGauntlet || !workflow.targets.size) return;
    let sourceSize = actorUtils.getSize(workflow.actor);
    let targetSize = actorUtils.getSize(workflow.targets.first().actor);
    if (targetSize - 2 >= sourceSize) {
        let effectData = {
            name: genericUtils.translate('CHRISPREMADES.GenericEffects.InvalidTarget'),
            img: constants.tempConditionIcon,
            origin: workflow.item.uuid,
            duration: {
                turns: 1
            },
            changes: [
                {
                    key: 'flags.midi-qol.min.ability.save.all',
                    value: 99,
                    mode: 5,
                    priority: 120
                }
            ],
            flags: {
                dae: {
                    specialDuration: [
                        'isSave'
                    ]
                },
                'chris-premades': {
                    effect: {
                        noAnimation: true
                    }
                }
            }
        };
        await effectUtils.createEffect(workflow.targets.first().actor, effectData);
    }
    let targetWorkflow = await workflowUtils.syntheticItemRoll(item, Array.from(workflow.targets), {consumeResources: true, consumeUsage: true});
    if (targetWorkflow.failedSaves.size) {
        await tokenUtils.pushToken(workflow.token, workflow.targets.first(), 10);
    } else {
        await tokenUtils.pushToken(workflow.targets.first(), workflow.token, 10);
    }
}
export let forceGauntlet = {
    name: 'Force Gauntlet',
    version: '1.5.25',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 150
            },
            {
                pass: 'rollFinished',
                macro: used,
                priority: 150
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '2d6',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'force',
            category: 'homebrew',
            homebrew: true,
            options: constants.damageTypeOptions
        }
    ]
};