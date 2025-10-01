import {activityUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger, workflow}) {
    if (!workflow.token || !workflow.targets.size) return;
    let identifier = activityUtils.getIdentifier(workflow.activity);
    if (!identifier) return;
    await workflowUtils.replaceDamage(workflow, '(@scaling)d10', {damageType: identifier});
}
async function use({trigger, workflow}) {
    let damageTypes = workflowUtils.getDamageTypes(workflow.damageRolls);
    let damage = workflowUtils.getTotalDamageOfType(workflow.damageDetail, workflow.targets.first().actor, damageTypes.first());
    await workflowUtils.applyDamage([workflow.token], damage, damageTypes.first() === 'necrotic' ? 'healing' : 'none');
    if (workflow.actor.system.attributes.hp.value != 0) return;
    await genericUtils.update(workflow.actor, {'system.attributes.death.success': 3});
}
async function distance({trigger, workflow}) {
    let combatMasteryUnfettered = itemUtils.getItemByIdentifier(workflow.actor, 'combatMasteryUnfettered');
    let maxDistance = combatMasteryUnfettered ? 30 : 5;
    if (tokenUtils.getDistance(workflow.token, workflow.targets.first()) <= maxDistance) return;
    workflow.aborted = true;
    genericUtils.notify('CHRISPREMADES.Macros.BalefulInterdict.Move.TooFar', 'info', {localize: true});
}
export let infernalConduit = {
    name: 'Infernal Conduit',
    version: '1.3.80',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: distance,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'illrigger',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'infernal-conduit',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: [
        {
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'infernal-conduit',
                    type: 'number',
                    distance: {
                        units: ''
                    },
                    scale: {
                        6: {
                            value: 3
                        },
                        7: {
                            value: 4
                        },
                        9: {
                            value: 5
                        },
                        11: {
                            value: 6
                        },
                        13: {
                            value: 7
                        },
                        15: {
                            value: 8
                        },
                        17: {
                            value: 9
                        },
                        19: {
                            value: 10
                        }
                    }
                },
                value: {},
                title: 'Infernal Conduit'
            }
        }
    ]
};