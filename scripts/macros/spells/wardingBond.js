import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js'
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let effect = chris.findEffect(workflow.targets.first().actor, 'Warding Bond - Target');
    if (effect) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Dismiss Warding Bond', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dismiss Warding Bond');
    let targetToken = workflow.targets.first();
    featureData.name = 'Dismiss Warding Bond: ' + targetToken.actor.name;
    let effectData = {
        'label': featureData.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': 'await warpgate.revert(token.document, "Warding Bond: ' + targetToken.uuid + '");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                },
                'spell': {
                    'wardingBond': {
                        'targetUuid': targetToken.document.uuid
                    }
                }
            }
        },
        'transfer': true
    };
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [featureData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Warding Bond: ' + targetToken.uuid,
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    let effectData2 = {
        'label': 'Warding Bond - Target',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 3600
        },
        'changes': [
            {
                'key': 'system.attributes.ac.bonus',
                'mode': 2,
                'value': '+1',
                'priority': 20
            },
            {
                'key': 'system.bonuses.abilities.save',
                'mode': 2,
                'value': '+1',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.all',
                'mode': 0,
                'value': '1',
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.spell.wardingBond.sourceUuid',
                'mode': 5,
                'value': workflow.token.document.uuid,
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.feature.onHit',
                'mode': 5,
                'value': 'wardingBond',
                'priority': 20
            }
        ],
        'transfer': true
    };
    await chris.createEffect(workflow.targets.first().actor, effectData2);
}
async function dismiss({speaker, actor, token, character, item, args, scope, workflow}) {
    let targetTokenUuid = workflow.item.flags['chris-premades']?.spell?.wardingBond?.targetUuid;
    if (!targetTokenUuid) return;
    let targetToken = await fromUuid(targetTokenUuid);
    if (!targetToken) return;
    let targetEffect = chris.findEffect(targetToken.actor, 'Warding Bond - Target');
    if (targetEffect) await chris.removeEffect(targetEffect);
    let sourceEffect = chris.findEffect(workflow.actor, 'Warding Bond:' + targetActor.name);
    if (!sourceEffect) return;
    await chris.removeEffect(sourceEffect);
}
async function onHit(workflow, targetToken) {
    if (workflow.hitTargets.size === 0 || !workflow.damageList) return;
    let effect = chris.findEffect(targetToken.actor, 'Warding Bond - Target');
    if (!effect) return;
    let bondTokenUuid = targetToken.actor.flags['chris-premades']?.spell?.wardingBond?.sourceUuid;
    if (!bondTokenUuid) return;
    let damageInfo = workflow.damageList.find(list => list.actorId === targetToken.actor.id);
    if (!damageInfo) return;
    if (damageInfo.appliedDamage === 0) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Warding Bond - Damage', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Warding Bond - Damage');
    featureData.system.damage.parts = [
        [
            damageInfo.appliedDamage + '[none]',
            'none'
        ]
    ];
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': targetToken.actor});
    let sourceToken = await fromUuid(bondTokenUuid);
    if (!sourceToken) return;
    let options = constants.syntheticItemWorkflowOptions([sourceToken.uuid]);
    let damageWorkflow = await MidiQOL.completeItemUse(feature, {}, options);
    if (damageWorkflow.targets.first().actor.system.attributes.hp.value != 0) return;
    await chris.removeEffect(effect);
    let sourceEffect = sourceToken.actor.effects.find(eff => eff.flags['chris-premades']?.spell?.wardingBond?.targetUuid === targetToken.document.uuid);
    if (!sourceEffect) return;
    await chris.removeEffect(sourceEffect);
}
async function moveTarget(token, changes) {
    if (game.settings.get('chris-premades', 'LastGM') != game.user.id) return;
    if (!changes.x && !changes.y && !changes.elevation) return;
    let effect = chris.findEffect(token.actor, 'Warding Bond - Target');
    if (!effect) return;
    let bondTokenUuid = token.actor.flags['chris-premades']?.spell?.wardingBond?.sourceUuid;
    if (!bondTokenUuid) return;
    let sourceToken = await fromUuid(bondTokenUuid);
    if (!sourceToken) return;
    let distance = chris.getDistance(token, sourceToken);
    if (distance <= 60) return;
    let selection = await chris.dialog('Warding Bond: Distance over 60 feet, remove effect?', [['Yes', true], ['No', false]]);
    if (!selection) return;
    await chris.removeEffect(effect);
    let sourceEffect = sourceToken.actor.effects.find(eff => eff.flags['chris-premades']?.spell?.wardingBond?.targetUuid === token.uuid);
    if (!sourceEffect) return;
    await chris.removeEffect(sourceEffect);
}
async function moveSource(token, changes) {
    if (game.settings.get('chris-premades', 'LastGM') != game.user.id) return;
    if (!changes.x && !changes.y && !changes.elevation) return;
    let effects = token.actor.effects.filter(eff => eff.flags['chris-premades']?.spell?.wardingBond?.targetUuid);
    if (effects.length === 0) return;
    for (let i of effects) {
        let targetToken = await fromUuid(i.flags['chris-premades']?.spell?.wardingBond?.targetUuid);
        if (!targetToken) continue;
        let distance = chris.getDistance(token, targetToken);
        if (distance <= 60) continue;
        let selection = await chris.dialog('Warding Bond: Distance over 60 feet, remove effect?', [['Yes', true], ['No', false]]);
        if (!selection) continue;
        await chris.removeEffect(i);
        let targetEffect = chris.findEffect(targetToken.actor, 'Warding Bond - Target');
        if (!targetEffect) continue;
        await chris.removeEffect(targetEffect);
    }
}
export let wardingBond = {
    'item': item,
    'onHit': onHit,
    'moveTarget': moveTarget,
    'moveSource': moveSource,
    'dismiss': dismiss
}