import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, effectUtils, itemUtils, Logging, workflowUtils} from '../../../../proxy.mjs';
import {'channel-divinity' as channelDivinityLegacy, turnUndead as turnUndeadLegacy} from '../../../legacy.mjs';
async function promptChannelDivinities({data: {workflow}}) {
    if (!workflow) return;
    const notFound = id => Logging.addMacroWarning('chris-premades', 'channel-divinity', 'Could not find an activity with identifier ' + id);
    const choices = [];
    const turn = itemUtils.getActivityByIdentifier(workflow.item, 'turn');
    if (!turn) notFound('turn');
    else choices.push(turn);
    const target = workflow.targets.first()?.document;
    if (target) {
        const disposition = workflow.token.document.disposition || 1;
        const id = target.disposition === disposition ? 'heal' : 'damage';
        const spark = itemUtils.getActivityByIdentifier(workflow.item, id);
        if (!spark) notFound(id);
        else choices.push(spark);
    }
    return choices;
}
async function applyTurnUndead({workflow}) {
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
    await Promise.all(Array.from(workflow.failedSaves).map(t => {
        if (t.actor?.system.attributes.hp.value === 0) return;
        return effectUtils.createEffects(t.actor, [turnData]);
    }));
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
    notes: channelDivinityLegacy.notes,
    roll: channelDivinityLegacy.roll,
    called: [
        {
            pass: 'actorChannelDivinityCleric',
            macro: promptChannelDivinities,
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
export const divineSparkDamage = {
    name: 'Divine Spark Damage',
    version: channelDivinity.version,
    rules: channelDivinity.rules,
    roll: [
        {
            pass: 'activityDamageRoll',
            macro: damageType,
            priority: 50
        },
    ]
};
export const turnUndead = {
    name: 'Turn Undead',
    ...divineSparkDamage,
    roll: [
        turnUndeadLegacy.roll[0],
        {
            pass: 'activityRollFinished',
            macro: applyTurnUndead,
            priority: 50
        }
    ],
};
