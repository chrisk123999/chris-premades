import {constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function early({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let ability = itemUtils.getConfig(workflow.item, 'ability');
    let maxTargets = Math.max(1, workflow.actor.system.abilities[ability].mod);
    if (workflow.targets.size <= maxTargets) return;
    let oldTargets = Array.from(workflow.targets);
    let newTargets;
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.UpcastTargets.Select', {maxTargets}), oldTargets, {type: 'multiple', maxAmount: maxTargets, skipDeadAndUnconscious: false});
    if (!selection) {
        newTargets = oldTargets.slice(0, maxTargets);
    } else {
        newTargets = selection[0] ?? [];
    }
    await workflowUtils.updateTargets(workflow, newTargets);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.fixScales(item);
}
export let groupRecovery = {
    name: 'Group Recovery',
    version: '1.3.164',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
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
            value: 'subclassIdentifier',
            label: 'CHRISPREMADES.Config.SubclassIdentifier',
            type: 'text',
            default: 'banneret',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'group-recovery',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'ability',
            label: 'CHRISPREMADES.Config.Ability',
            type: 'select',
            default: 'cha',
            options: constants.abilityOptions,
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: [
        {
            classIdentifier: 'subclassIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'group-recovery',
                    type: 'number',
                    distance: {
                        units: ''
                    },
                    scale: {
                        3: {
                            value: 30
                        },
                        18: {
                            value: 60
                        }
                    }
                },
                value: {},
                title: 'Group Recovery'
            }
        }
    ]
};