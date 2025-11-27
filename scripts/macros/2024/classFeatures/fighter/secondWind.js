import {dialogUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function added({trigger: {entity: item}}) {
    await itemUtils.fixScales(item);
}
async function use({trigger, workflow}) {
    if (!workflow.token) return;
    let groupRecovery = itemUtils.getItemByIdentifier(workflow.actor, 'groupRecovery');
    if (groupRecovery?.system?.uses?.value) {
        let subclassIdentifier = itemUtils.getConfig(groupRecovery, 'subclassIdentifier');
        let scaleIdentifier = itemUtils.getConfig(groupRecovery, 'scaleIdentifier');
        let scale = workflow.actor.system.scale[subclassIdentifier]?.[scaleIdentifier];
        if (scale) {
            let nearby = tokenUtils.findNearby(workflow.token, scale.value, 'ally', {includeIncapacitated: true});
            if (nearby.length) {
                let selection = await dialogUtils.confirmUseItem(groupRecovery);
                if (selection) {
                    await workflowUtils.syntheticItemRoll(groupRecovery, nearby, {consumeResources: true, consumeUsage: true});
                }
            }
        }
    }
}
export let secondWind = {
    name: 'Second Wind',
    version: '1.3.146',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 45
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 45
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 45
        }
    ],
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'fighter',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'second-wind',
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
                    identifier: 'second-wind',
                    type: 'number',
                    distance: {
                        units: ''
                    },
                    scale: {
                        1: {
                            value: 2
                        },
                        4: {
                            value: 3
                        },
                        10: {
                            value: 4
                        }
                    }
                },
                value: {},
                title: 'Second Wind'
            }
        }
    ]
};