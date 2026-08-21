import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, effectUtils, itemUtils, Logging, workflowUtils} from '../../../../proxy.mjs';
// TODO turn resistance and immunity
async function preTurnUndead({workflow}) {
    if (!workflow.targets.size) return;
    const validCreatures = automationUtils.getConfigValue(workflow.item, 'creatureTypes') ?? [];
    const targets = workflow.targets.filter(t => validCreatures.includes(actorUtils.typeOrRace(t.actor)));
    if (targets.size !== workflow.targets.size) await workflowUtils.updateTargets(workflow, targets);
}
async function postTurnUndead({workflow}) {
    if (!workflow.failedSaves.size) return;
    const turnedEffect = workflow.activity.effects[0]?.effect ?? workflow.item.effects.contents[0];
    if (!turnedEffect) return;
    const casterEffect = workflow.item.effects.contents.find(e => e.id !== turnedEffect.id);
    if (!casterEffect) return;
    const sourceData = documentUtils.getEffectData(workflow.activity, casterEffect.id);
    const sourceEffect = (await effectUtils.createEffects(workflow.actor, [sourceData]))?.[0];
    if (!sourceEffect) return;
    const searUndead = actorUtils.getItemByIdentifier(workflow.actor, 'sear-undead');
    if (searUndead) await workflowUtils.syntheticItemRoll(searUndead, workflow.failedSaves.map(t => t.document));
    const turnData = documentUtils.getEffectData(workflow.activity, turnedEffect.id, {parentEntity: sourceEffect});
    await Promise.all(workflow.failedSaves.map(t => effectUtils.createEffects(t.actor, [turnData])));
}
async function spark({workflow}) {
    const target = workflow.targets.first()?.document;
    if (!target) return;
    const disposition = workflow.token.document.disposition || 1;
    const id = target.disposition === disposition ? 'heal' : 'damage';
    const activity = itemUtils.getActivityByIdentifier(workflow.item, id);
    if (!activity) {
        Logging.addMacroWarning('chris-premades', 'channel-divinity', 'Could not find an activity with identifier ' + id);
        return;
    }
    await workflowUtils.syntheticActivityRoll(activity, [target]);
}
async function damageType({workflow}) {
    const types = automationUtils.getConfigValue(workflow.item, 'damageTypes') ?? [];
    let selection = await dialogUtils.selectDamageType(types, workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType');
    if (!selection) selection = types[0] ?? 'radiant';
    workflow.damageRolls.forEach(roll => roll.options.type = selection);
    await workflow.setDamageRolls(workflow.damageRolls);
    workflow.defaultDamageType = selection;
}
export const channelDivinity = {
    name: 'Channel Divinity',
    version: '2.0.3',
    rules: '2024',
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
    ],
    config: {
        creatureTypes: {
            default: ['undead'],
            type: 'select-many',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            get options() { return constants.creatureTypeOptions(); }
        },
        damageTypes: {
            default: ['necrotic', 'radiant'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageTypes',
            get options() { return constants.damageTypeOptions(); }
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
                        2: {value: 2},
                        6: {value: 3},
                        18: {value: 4}
                    }
                },
                value: {},
                title: 'Channel Divinity'
            }
        }
    ]
};
export const divineSpark = {
    name: 'Divine Spark',
    version: channelDivinity.version,
    rules: channelDivinity.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: spark,
            priority: 50
        }
    ]
};
export const divineSparkDamage = {
    name: 'Divine Spark Damage',
    ...divineSpark,
    roll: [
        {
            pass: 'activityDamageRoll',
            macro: damageType,
            priority: 50
        },
    ]
};
