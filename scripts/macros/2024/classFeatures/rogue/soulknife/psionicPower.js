import {activityUtils, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../../utils.js';
async function psychicWhispersUse({trigger, workflow}) {
    if (!workflow.activity.consumption.targets.length) {
        await genericUtils.update(workflow.activity, {
            consumption: {
                targets:[
                    {
                        type: 'itemUses',
                        value: 1
                    }
                ]
            }
        });
    }
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration.seconds = workflow.utilityRolls[0].total * 3600;
    workflow.targets.add(workflow.token);
    await Promise.all(workflow.targets.map(async token => {
        await effectUtils.createEffect(token.actor, effectData);
    }));
}
async function psychicWhispersRest({trigger: {entity: item}}) {
    let activity = activityUtils.getActivityByIdentifier(item, 'psychicWhispers', {strict: true});
    if (!activity) return;
    await genericUtils.update(activity, {
        consumption: {
            targets: []
        }
    });
}
async function skillToolCheck({trigger: {entity: item, config, roll, actor, options}}) {
    if (typeof(roll.data.prof) != 'string') return;
    let targetValue = config?.midiOptions?.targetValue;
    if (targetValue) {
        if (roll.total >= targetValue) return;
    }
    let subclassIdentifier = itemUtils.getConfig(item, 'subclassIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    let scale = actor.system.scale[subclassIdentifier]?.[scaleIdentifier];
    if (!scale) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'psiBolsteredKnack', {strict: true});
    if (!activity) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: activity.name + ' (' + scale.die + ')', rollTotal: roll.total}));
    if (!selection) return;
    await workflowUtils.syntheticActivityRoll(activity, []);
    genericUtils.setProperty(options, 'chris-premades.psiBolsteredKnack', true);
    return await rollUtils.addToRoll(roll, '1' + scale.die);
}
async function skillToolCheckLate({trigger: {entity: item, config, roll, actor, options}}) {
    if (!options?.['chris-premades']?.psiBolsteredKnack) return;
    let targetValue = config?.midiOptions?.targetValue;
    if (targetValue) {
        if (roll.total < targetValue) return;
    } else {
        let selection = await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.PsionicPower.Confirm', {buttons: 'yesNo'});
        if (!selection) return;
    }
    await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
}
async function added({trigger: {entity: item}}) {
    await itemUtils.fixScales(item);
}
export let psionicPower = {
    name: 'Psionic Power',
    version: '1.3.57',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: psychicWhispersUse,
                priority: 50,
                activities: ['psychicWhispers']
            }
        ]
    },
    skill: [
        {
            pass: 'bonus',
            macro: skillToolCheck,
            priority: 50
        },
        {
            pass: 'post',
            macro: skillToolCheckLate,
            priority: 50
        }
    ],
    toolCheck: [
        {
            pass: 'bonus',
            macro: skillToolCheck,
            priority: 50
        },
        {
            pass: 'post',
            macro: skillToolCheckLate,
            priority: 50
        }
    ],
    rest: [
        {
            pass: 'long',
            macro: psychicWhispersRest,
            priority: 50
        }
    ],
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
            default: 'soulknife',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'energy-die',
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
                    identifier: 'energy-die',
                    type: 'dice',
                    distance: {
                        units: ''
                    },
                    scale: {
                        3: {
                            number: 4,
                            faces: 6,
                            modifiers: []
                        },
                        5: {
                            number: 6,
                            faces: 8,
                            modifiers: []
                        },
                        9: {
                            number: 8,
                            faces: 8,
                            modifiers: []
                        },
                        11: {
                            number: 8,
                            faces: 10,
                            modifiers: []
                        },
                        13: {
                            number: 10,
                            faces: 10,
                            modifiers: []
                        },
                        17: {
                            number: 12,
                            faces: 12,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Energy Die'
            }
        }
    ]
};