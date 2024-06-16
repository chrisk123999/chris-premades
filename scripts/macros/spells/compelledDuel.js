import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let effect = chris.findEffect(workflow.actor, 'Compelled Duel - Target');
    if (!effect) return;
    if (!effect.origin) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'compelledDuel', 50);
    if (!queueSetup) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let targetUuid = workflow.targets.first().document.uuid;
    let sourceUuid = effect.flags['chris-premades']?.spell?.compelledDuel?.sourceUuid;
    if (!sourceUuid) return;
    if (targetUuid === sourceUuid) {
        queue.remove(workflow.item.uuid);
        return;
    }
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add('Disadvantage: ' + origin.name);
    queue.remove(workflow.item.uuid);
}
async function attacker({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token);
    if (!workflow.targets.size) return;
    let effect = chris.findEffect(workflow.actor, 'Compelled Duel - Source');
    if (!effect) return;
    let targetUuid = effect.flags['chris-premades']?.spell?.compelledDuel?.targetUuid;
    if (!targetUuid) return;
    let endSpell = false;
    for (let i of Array.from(workflow.targets)) {
        if (constants.attacks.includes(workflow.item.actionType)) {
            if (i.document.uuid != targetUuid) {
                endSpell = true;
                break;
            } else {
                continue;
            }
        }
        let disposition = i.document.disposition;
        if (disposition != workflow.token.document.disposition) {
            if (i.document.uuid != targetUuid) {
                endSpell = true;
                break;
            }
        }
    }
    if (!endSpell) return;
    await endEffect(workflow.actor, effect.origin);
    // await chris.removeEffect(effect);
    // let targetToken = await fromUuid(targetUuid);
    // if (!targetToken) return;
    // let effect2 = chris.findEffect(targetToken.actor, 'Compelled Duel - Target');
    // if (!effect2) return;
    // await chris.removeEffect(effect2);
}
async function attacked(workflow) {
    if (!workflow.token || !workflow.targets.size) return;
    for (let token of Array.from(workflow.targets)) {
        let effect = chris.findEffect(token.actor, 'Compelled Duel - Target');
        if (!effect) continue;
        if (token.document.disposition === workflow.token.document.disposition) continue;
        let sourceUuid = effect.flags['chris-premades']?.spell?.compelledDuel?.sourceUuid;
        if (!sourceUuid) continue;
        if (workflow.token.document.uuid === sourceUuid) continue;
        await endEffect(fromUuidSync(effect.origin).actor, effect.origin);
        // await chris.removeEffect(effect);
        // let sourceToken = await fromUuid(sourceUuid);
        // if (!sourceToken) continue;
        // let effect2 = chris.findEffect(sourceToken.actor, 'Compelled Duel - Source');
        // if (!effect2) continue;
        // await chris.removeEffect(effect2);
    }
}
async function movement(token, updates, diff, id) {
    if (!chris.isLastGM()) return;
    if (token.parent.id != canvas.scene.id) return;
    if (!updates.x && !updates.y && !updates.elevation || diff.animate == false) return;
    let effect = chris.findEffect(token.actor, 'Compelled Duel - Target');
    if (!effect) return;
    let sourceUuid = effect.flags['chris-premades']?.spell?.compelledDuel?.sourceUuid;
    if (!sourceUuid) return;
    let sourceToken = fromUuidSync(sourceUuid);
    if (!sourceToken) return;
    let fakeTargetToken = {
        'width': token.width,
        'height': token.height,
        'x': diff['chris-premades'].coords.previous.x,
        'y': diff['chris-premades'].coords.previous.y,
        'elevation': diff['chris-premades'].coords.previous.elevation
    };
    let oldDistance = chris.getCoordDistance(sourceToken.object, fakeTargetToken);
    await token.object?._animation;
    let distance = chris.getDistance(sourceToken, token);
    if (oldDistance >= distance || distance <= 30) return;
    let turnCheck = chris.perTurnCheck(effect, 'spell', 'compelledDuel');
    if (!turnCheck) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Compelled Duel - Moved', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Compelled Duel - Moved');
    delete featureData._id;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    featureData.system.save.dc = chris.getSpellDC(originItem);
    let [config, options] = constants.syntheticItemWorkflowOptions([token.uuid]);
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': originItem.actor});
    let spellWorkflow = await MidiQOL.completeItemUse(feature, config, options);
    if (!spellWorkflow.failedSaves.size) {
        await chris.setTurnCheck(effect, 'spell', 'compelledDuel');
        return;
    }
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.misty_step.01.blue')
            .atLocation(token)
            .randomRotation()
            .scaleToObject(2)
            .wait(750)
        .animation()
            .on(token)
            .opacity(0.0)
            .teleportTo(fakeTargetToken)
            .wait(50)
        .effect()
            .file('jb2a.misty_step.02.blue')
            .atLocation(token)
            .randomRotation()
            .scaleToObject(2)
            .wait(1500)
        .animation()
            .on(token)
            .opacity(1.0)
        .play();
    /* eslint-enable indent */
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1) return;
    async function effectMacro() {
        await chrisPremades.macros.compelledDuel.end(effect);
    }
    async function effectMacro2() {
        await chrisPremades.macros.compelledDuel.turnEnd(effect, token, origin);
    }
    let effectDataTarget = {
        'label': 'Compelled Duel - Target',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
        'changes': [
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.compelledDuel.attack,preAttackRoll',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'spell': {
                    'compelledDuel': {
                        'sourceUuid': workflow.token.document.uuid
                    }
                }
            },
            'effectmacro': {
                'onCombatEnd': {
                    'script': chris.functionToString(effectMacro)
                }
            }
        }
    };
    let effectDataSource ={
        'label': 'Compelled Duel - Source',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'changes': [
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.compelledDuel.attacker,postAttackRoll',
                'priority': 20
            }
        ],
        'origin': workflow.item.uuid,
        'flags': {
            'chris-premades': {
                'spell': {
                    'compelledDuel': {
                        'targetUuid': workflow.targets.first().document.uuid
                    }
                }
            },
            'effectmacro': {
                'onTurnEnd': {
                    'script': chris.functionToString(effectMacro2)
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, effectDataSource, workflow.item);
    await chris.createEffect(workflow.targets.first().actor, effectDataTarget, workflow.item);
}
async function end(effect) {
    await chris.setTurnCheck(effect, 'spell', 'compelledDuel', true);
}
async function turnEnd(effect, token, origin) {
    let targetUuid = effect.flags['chris-premades']?.spell?.compelledDuel?.targetUuid;
    if (!targetUuid) return;
    let targetToken = await fromUuid(targetUuid);
    if (!targetToken) return;
    let distance = chris.getDistance(token, targetToken);
    if (distance <= 30) return;
    let selection = await chris.remoteDialog(origin.name, constants.yesNo, chris.lastGM(), 'Caster has ended their turn more than 30 feet away from their target. Remove effect?');
    if (!selection) return;
    await endEffect(origin.actor, origin);
    // await chris.removeEffect(effect);
    // let targetEffect = chris.findEffect(targetToken.actor, 'Compelled Duel - Target');
    // if (!targetEffect) return;
    // await chris.removeEffect(targetEffect);
}

async function endEffect(originActor, originItemRef) {
    let concentrationEffect = MidiQOL.getConcentrationEffect(originActor, originItemRef);
    return await chris.removeEffect(concentrationEffect);
}

export let compelledDuel = {
    'attack': attack,
    'attacker': attacker,
    'attacked': attacked,
    'movement': movement,
    'item': item,
    'end': end,
    'turnEnd': turnEnd
};