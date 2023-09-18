import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {translate} from '../../../translations.js';
import {queue} from '../../../utility/queue.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.item.system.actionType != 'mwak') return;
    let originFeature = chris.getItem(workflow.actor, 'Strike of the Giants: Cloud Strike');
    if (!originFeature) return;
    if (!originFeature.system.uses.value) return;
    let turnCheck = chris.perTurnCheck(originFeature, 'feat', 'cloudStrike', false, workflow.token.id);
    if (!turnCheck) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'cloudStrike', 150);
    if (!queueSetup) return;
    let selection = await chris.dialog(originFeature.name, [['Yes', true], ['No', false]], 'Use ' + originFeature.name + '?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await originFeature.update({'system.uses.value': originFeature.system.uses.value - 1});
    if (chris.inCombat()) await originFeature.setFlag('chris-premades', 'feat.cloudStrike.turn', game.combat.round + '-' + game.combat.turn);
    let damageFormula = workflow.damageRoll._formula;
    let bonusDamage = '1d4[' + translate.damageType('thunder') + ']';
    if (workflow.isCritical) bonusDamage = chris.getCriticalFormula(bonusDamage);
    let damageRoll = await new Roll(damageFormula + ' + ' + bonusDamage).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    let saveDC = Math.max(workflow.actor.system.abilities.con.dc, workflow.actor.system.abilities.str.dc);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Feat Features', 'Strike of the Giants: Cloud Strike', false);
    if (!featureData) {
        queue.remove(workflow.item.uuid);
        return;
    }
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Strike of the Giants: Cloud Strike');
    featureData.system.save.dc = saveDC;
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    feature.prepareData();
    feature.prepareFinalAttributes();
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.hitTargets.first().document.uuid]);
    await warpgate.wait(100);
    let targetWorkflow = await MidiQOL.completeItemUse(feature, config, options);
    if (targetWorkflow.failedSaves.size === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let targetEffect = chris.findEffect(targetWorkflow.failedSaves.first().actor, 'Strike of the Giants: Cloud Strike');
    if (!targetEffect) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await chris.updateEffect(targetEffect, {'origin': originFeature.uuid});
    let effectData = {
        'label': 'Strike of the Giants: Cloud Strike - Invisible',
        'icon': originFeature.img,
        'origin': originFeature.uuid,
        'duration': {
            'seconds': 12
        },
        'changes': [
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.cloudStrike.selfAttack,postActiveEffects',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'turnStart'
                ],
                'macroRepeat': 'none'
            },
            'effectmacro': {
                'onDelete': {
                    'script': 'await chrisPremades.macros.cloudStrike.remove(effect);'
                }
            },
            'chris-premades': {
                'feat': {
                    'cloudStrike': {
                        'targetEffectUuid': targetEffect.uuid,
                        'ignore': true
                    }
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData);
    queue.remove(workflow.item.uuid);
}
async function end(origin) {
    await origin.setFlag('chris-premades', 'feat.cloudStrike.turn', null);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.disadvantage) return;
    let validTypes = ['mwak', 'rwak', 'msak', 'rsak'];
    if (!validTypes.includes(workflow.item.system.actionType)) return;
    let effect = chris.findEffect(workflow.actor, 'Strike of the Giants: Cloud Strike');
    if (!effect) return;
    if (!effect.origin) return;
    let originItem = await fromUuid(effect.origin);
    if (originItem.actor.uuid != workflow.targets.first().actor.uuid) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'cloudStrike', 150);
    if (!queueSetup) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add('Disadvantage: ' + originItem.name);
    queue.remove(workflow.item.uuid);
}
async function remove(effect) {
    let targetEffectUuid = effect.flags?.['chris-premades']?.feat?.cloudStrike?.targetEffectUuid;
    if (!targetEffectUuid) return;
    let effect2 = await fromUuid(targetEffectUuid);
    if (!effect2) return;
    await chris.removeEffect(effect2);
}
async function selfAttack({speaker, actor, token, character, item, args, scope, workflow}) {
    let validTypes = ['mwak', 'rwak', 'msak', 'rsak'];
    if (!validTypes.includes(workflow.item.system.actionType)) return;
    let effect = chris.findEffect(workflow.actor, 'Strike of the Giants: Cloud Strike - Invisible');
    if (!effect) return;
    let ignore = effect.flags?.['chris-premades']?.feat?.cloudStrike?.ignore;
    if (ignore) {
        await effect.setFlag('chris-premades', 'feat.cloudStrike.ignore', false);
        return;
    }
    await chris.removeEffect(effect);
}
export let cloudStrike = {
    'damage': damage,
    'end': end,
    'attack': attack,
    'remove': remove,
    'selfAttack': selfAttack
}