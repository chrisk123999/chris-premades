import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, effectUtils, itemUtils, workflowUtils} from '../../../../proxy.mjs';
async function collectChannelDivinities({workflow}) {
    const activity = workflow.activity;
    const activities = await automationUtils.calledEvent('channelDivinityCleric', workflow.actor, {canOverlap: true, multiResult: true, data: {workflow}});
    const choices = activities.flat().filter(a => a instanceof dnd5e.dataModels.activity.BaseActivityData);
    if (!choices?.length) return;
    const options = {addNoneDocument: true, checkbox: true, max: 1};
    const choice = await dialogUtils.selectDocumentDialog(activity.item.name, 'CHRISPREMADES.Macros.All.ChannelDivinity', choices, options);
    if (!choice) return;
    await workflowUtils.syntheticActivityRoll(choice, workflow.targets.map(t => t.document));
}
async function promptTurnUndead({data, document: activity}) {
    return itemUtils.getActivityByIdentifier(activity.item, 'turn-undead');
}
async function preTurnUndead({workflow}) {
    if (!workflow.targets.size) return;
    const validCreatures = automationUtils.getConfigValue(workflow.item, 'creatureTypes') ?? [];
    const targets = workflow.targets.filter(t => 
        t.actor?.system.attributes.hp.value > 0 &&
        validCreatures.includes(actorUtils.typeOrRace(t.actor))
    );
    if (targets.size !== workflow.targets.size) await workflowUtils.updateTargets(workflow, targets);
}
async function postTurnUndead({workflow}) {
    if (!workflow.failedSaves.size) return;
    const turnedEffect = workflow.activity.effects[0]?.effect ?? workflow.item.effects.contents[0];
    if (!turnedEffect) return;
    const destroyUndead = actorUtils.getItemByIdentifier(workflow.actor, 'destroy-undead');
    if (destroyUndead) await workflowUtils.syntheticItemRoll(destroyUndead, workflow.failedSaves.map(t => t.document));
    const turnData = documentUtils.getEffectData(workflow.activity, turnedEffect.id);
    await Promise.all(Array.from(workflow.failedSaves).map(t => {
        if (t.actor?.system.attributes.hp.value === 0) return;
        return effectUtils.createEffects(t.actor, [turnData]);
    }));
}
export const channelDivinity = {
    name: 'Channel Divinity',
    version: '2.0.3',
    rules: '2014',
    notes: 'Use the "actorChannelDivinityCleric" called event (async) to add to the array of activities used as choices.\n\tData available: workflow.',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: collectChannelDivinities,
            priority: 50
        }
    ],
    called: [
        {
            pass: 'actorChannelDivinityCleric',
            macro: promptTurnUndead,
            priority: 200
        }
    ],
    config: {
        creatureTypes: {
            default: ['undead'],
            type: 'select-many',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            get options() { return constants.creatureTypeOptions(); }
        },
        classIdentifier: {
            default: 'cleric',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'channel-divinity',
            classIdentifier: 'cleric',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'channel-divinity',
                    type: 'number',
                    scale: {
                        2: {value: 1},
                        6: {value: 2},
                        18: {value: 3}
                    }
                },
                value: {},
                title: 'Channel Divinity'
            }
        }
    ]
};
export const turnUndead = {
    name: 'Turn Undead',
    version: channelDivinity.version,
    rules: channelDivinity.rules,
    roll: [
        {
            pass: 'activityPreambleComplete',
            macro: preTurnUndead,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: postTurnUndead,
            priority: 50
        }
    ]
};
