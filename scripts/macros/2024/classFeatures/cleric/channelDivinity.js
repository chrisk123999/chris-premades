import {activityUtils, actorUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function spark({trigger, workflow}) {
    if (!workflow.actor || !workflow.targets.size) return;
    let disposition = workflow.token?.document?.disposition ?? workflow.actor.prototype.token.disposition;
    if (disposition === 0) disposition = 1;
    let activity;
    if (workflow.targets.first().document.disposition === disposition) {
        activity = activityUtils.getActivityByIdentifier(workflow.item, 'heal', {strict: true});
    } else {
        activity = activityUtils.getActivityByIdentifier(workflow.item, 'damage', {strict: true});
    }
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.targets.first()]);
}
async function turnEarly({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let advData = {
        name: 'Turn Advantage',
        img: constants.tempConditionIcon,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.advantage.ability.save.wis',
                value: 1,
                mode: 5,
                priority: 120
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'isSave'
                ],
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    let immuneData = {
        name: 'Turn Immunity',
        img: constants.tempConditionIcon,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.min.ability.save.wis',
                value: 100,
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
    let validTargets = [];
    let validTypes = itemUtils.getConfig(workflow.item, 'creatureTypes');
    await Promise.all(workflow.targets.map(async token => {
        let type = actorUtils.typeOrRace(token.actor);
        if (!validTypes.includes(type)) return;
        if (token.actor.flags['chris-premades']?.turnResistance) await effectUtils.createEffect(token.actor, advData);
        if (token.actor.flags['chris-premades']?.turnImmunity) await effectUtils.createEffect(token.actor, immuneData);
        validTargets.push(token);
    }));
    genericUtils.updateTargets(validTargets);
}
async function turnLate({trigger, workflow}) {
    if (!workflow.failedSaves.size) return;
    let sourceEffect = workflow.item.effects.contents?.[1];
    let sourceTurnEffect = workflow.item.effects.contents?.[0];
    if (!sourceTurnEffect || !sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let turnEffectData = genericUtils.duplicate(sourceTurnEffect.toObject());
    turnEffectData.duration = itemUtils.convertDuration(workflow.activity);
    let effect = await effectUtils.createEffect(workflow.actor, effectData);
    let searUndead = itemUtils.getItemByIdentifier(workflow.actor, 'searUndead');
    if (searUndead) await workflowUtils.syntheticItemRoll(searUndead, Array.from(workflow.failedSaves));
    await Promise.all(workflow.failedSaves.map(async token => {
        await effectUtils.createEffect(token.actor, turnEffectData, {parentEntity: effect});
    }));
}
async function damage({trigger, workflow}) {
    let damageTypes = itemUtils.getConfig(workflow.item, 'damageTypes');
    let selection = await dialogUtils.selectDamageType(damageTypes, workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType');
    if (!selection) selection = damageTypes[0];
    workflow.damageRolls.forEach(roll => roll.options.type = selection);
    await workflow.setDamageRolls(workflow.damageRolls);
    workflow.defaultDamageType = selection;
}
async function added({trigger: {entity: item, actor}}) {
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    let scale = actor.system.scale?.[classIdentifier]?.[scaleIdentifier];
    if (scale) return;
    let classItem = actor.classes[classIdentifier];
    if (!classItem) return;
    let classData = genericUtils.duplicate(classItem.toObject());
    classData.system.advancement.push(channelDivinity.scales[0].data);
    await genericUtils.update(classItem, {'system.advancement': classData.system.advancement});
    let message = genericUtils.format('CHRISPREMADES.Requirements.ScaleAdded', {classIdentifier, scaleIdentifier});
    genericUtils.notify(message, 'info');
}
export let channelDivinity = {
    name: 'Channel Divinity',
    version: '1.2.13',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: spark,
                priority: 50,
                activities: ['spark']
            },
            {
                pass: 'rollFinished',
                macro: turnLate,
                priority: 50,
                activities: ['turn']
            },
            {
                pass: 'preambleComplete',
                macro: turnEarly,
                priority: 50,
                activities: ['turn']
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50,
                activities: ['damage']
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
            priority: 50
        }
    ],
    config: [
        {
            value: 'creatureTypes',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            type: 'select-many',
            options: constants.creatureTypeOptions,
            default: ['undead'],
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            options: constants.damageTypeOptions,
            default: ['radiant', 'necrotic'],
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'cleric',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'channel-divinity',
            category: 'homebrew',
            homebrew: true
        },
    ],
    scales: [
        {
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'channel-divinity',
                    type: 'number',
                    distance: {
                        units: ''
                    },
                    scale: {
                        2: {
                            value: 2
                        },
                        6: {
                            value: 3
                        },
                        18: {
                            value: 4
                        }
                    }
                },
                value: {},
                title: 'Channel Divinity'
            }
        }
    ]
};