import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {tashaSummon} from '../../utility/tashaSummon.js';

async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Earthen Hand');
    if (!sourceActor) return;
    let name = chris.getConfiguration(workflow.item, 'name');
    if (name === '') name = 'Earthen Hand';
    let updates = {
        'actor': {
            'protoTypeToken': {
                'name': name
            }
        },
        'token': {
            'name': name
        }
    };
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar');
    if (avatarImg) updates.actor.img = avatarImg;
    let tokenImg = chris.getConfiguration(workflow.item, 'token');
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = chris.getConfiguration(workflow.item, 'animation');
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    let summon = await tashaSummon.spawn(sourceActor, updates, 60, workflow.item, 30, workflow.token, animation);
    if (!summon) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Maximilian\'s Earthen Grasp - Grasp');
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Maximilian\'s Earthen Grasp - Grasp');
    featureData.system.save.dc = chris.getSpellDC(workflow.item);
    setProperty(featureData, 'flags.chris-premades.spell.maximiliansEarthenGrasp.summonUuid', summon.uuid);
    let updates2 = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Maximilian\'s Earthen Grasp',
        'description': 'Maximilian\'s Earthen Grasp'
    }
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    if (!effect) return;
    let currentScript = effect.flags.effectmacro?.onDelete?.script;
    if (!currentScript) return;
    let effectUpdates = {
        'flags': {
            'effectmacro': {
                'onDelete': { 
                    'script': 'await chrisPremades.macros.maximiliansEarthenGrasp.end(token); ' + currentScript
                }
            }
        }
    };
    await chris.updateEffect(effect, effectUpdates);
    let feature = workflow.actor.items.getName('Maximilian\'s Earthen Grasp - Grasp');
    if (feature) {
        let nearbyTargets = chris.findNearby(summon, 5, 'all', true, false).filter(i => i.document.disposition != workflow.token.document.disposition);
        let targetUuid;
        if (!nearbyTargets.length) {
            ui.notifications.info('No nearby targets to grasp!')
            return;
        } else if (nearbyTargets.length === 1) {
            targetUuid = nearbyTargets[0].document.uuid;
        } else {
            let selection = await chris.selectTarget(workflow.item.name, constants.okCancel, nearbyTargets, true, 'one', undefined, undefined, 'Select a target to grasp:');
            if (!selection.buttons) return;
            targetUuid = selection.inputs.find(i => i);
            if (!targetUuid) return;
        }
        let [config, options] = constants.syntheticItemWorkflowOptions([targetUuid]);
        await warpgate.wait(100);
        await MidiQOL.completeItemUse(feature, config, options);
    }
}
async function graspEarly({speaker, actor, token, character, item, args, scope, workflow}) {
    let lastTargetUuid = workflow.item.flags['chris-premades']?.spell?.maximiliansEarthenGrasp?.lastTargetUuid;
    if (lastTargetUuid) {
        let effect = await fromUuid(lastTargetUuid);
        if (effect) await chris.removeEffect(effect);
        await workflow.item.setFlag('chris-premades', 'spell.maximiliansEarthenGrasp.lastTargetUuid', null);
        await warpgate.revert(workflow.token.document, 'Maximilian\'s Earthen Grasp - Crush');
    }
    let summonUuid = workflow.item.flags['chris-premades']?.spell?.maximiliansEarthenGrasp?.summonUuid;
    if (!summonUuid) return;
    let summonToken = await fromUuid(summonUuid);
    if (!summonToken) return;
    if (workflow.targets.size) {
        let targetToken = workflow.targets.first();
        if (chris.getDistance(summonToken, targetToken) <= 5) return;
    }
    let nearbyTargets = chris.findNearby(summonToken, 5, 'all', true, false).filter(i => i.document.disposition != workflow.token.document.disposition);
    if (!nearbyTargets.length) {
        ui.notifications.info('No nearby targets to grasp!')
        chris.updateTargets([]);
        return;
    } else if (nearbyTargets.length === 1) {
        chris.updateTargets([nearbyTargets[0].id]);
    } else {
        let selection = await chris.selectTarget(workflow.item.name, constants.okCancel, nearbyTargets, false, 'one', undefined, undefined, 'Select a target to grasp:');
        if (!selection.buttons) {
            chris.updateTargets([]);
            return;
        }
        let target = selection.inputs.find(i => i);
        if (target) {
            chris.updateTargets([target]);
        } else {
            chris.updateTargets([]);
        }
    }
}
async function graspLate({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.failedSaves.size) return;
    let targetToken = workflow.targets.first();
    let effect = chris.findEffect(targetToken.actor, 'Maximilian\'s Earthen Grasp - Grasp');
    let effect2 = chris.findEffect(workflow.actor, 'Maximilian\'s Earthen Grasp');
    if (!effect2 || !effect) return;
    let effectData = duplicate(effect2.toObject());
    let updates = {
        'duration': effectData.duration,
        'flags': {
            'chris-premades': {
                'spell': {
                    'maximiliansEarthenGrasp': {
                        'originItemUuid': effect2.origin
                    }
                }
            }
        }
    }
    await chris.updateEffect(effect, updates);
    await workflow.item.setFlag('chris-premades', 'spell.maximiliansEarthenGrasp.lastTargetUuid', effect.uuid);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Maximilian\'s Earthen Grasp - Crush');
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Maximilian\'s Earthen Grasp - Crush');
    featureData.system.save.dc = chris.getSpellDC(workflow.item);
    setProperty(featureData, 'flags.chris-premades.spell.maximiliansEarthenGrasp.targetUuid', targetToken.document.uuid);
    let updates2 = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            }
        }
    }
    let options = {
        'permanent': false,
        'name': 'Maximilian\'s Earthen Grasp - Crush',
        'description': 'Maximilian\'s Earthen Grasp - Crush'
    }
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
}
async function crush({speaker, actor, token, character, item, args, scope, workflow}) {
    let targetTokenUuid = workflow.item.flags['chris-premades']?.spell?.maximiliansEarthenGrasp?.targetUuid;
    let targets = [];
    if (targetTokenUuid) {
        let targetToken = await fromUuid(targetTokenUuid);
        if (targetToken) targets.push(targetToken.id);
    }
    chris.updateTargets(targets);
}
async function end(token) {
    let feature = token.actor.items.getName('Maximilian\'s Earthen Grasp - Grasp');
    if (feature) {
        let targetToken = canvas.scene.tokens.find(i => chris.getEffects(i.actor).find(j => j.name === 'Maximilian\'s Earthen Grasp - Grasp' && j.origin === feature.uuid));
        if (targetToken) {
            let targetEffect = chris.findEffect(targetToken.actor, 'Maximilian\'s Earthen Grasp - Grasp');
            if (targetEffect) await chris.removeEffect(targetEffect);
        }
    }
    await warpgate.revert(token.document, 'Maximilian\'s Earthen Grasp - Crush');
    await warpgate.revert(token.document, 'Maximilian\'s Earthen Grasp');
}
export let maximiliansEarthenGrasp = {
    'item': item,
    'graspLate': graspLate,
    'graspEarly': graspEarly,
    'crush': crush,
    'end': end
}