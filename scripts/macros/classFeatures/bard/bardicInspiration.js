import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let classIdentifier = chris.getConfiguration(workflow.item, 'classidentifier') ?? 'bard';
    let scaleIdentifier = chris.getConfiguration(workflow.item, 'scaleidentifier') ?? 'bardic-inspiration';
    let scale = workflow.actor.system.scale[classIdentifier]?.[scaleIdentifier];
    if (!scale) {
        ui.notifications.warn('Actor does not appear to have a Bardic Inspiration scale set!');
        return;
    }
    let effectData = {
        'icon': workflow.item.img,
        'changes': [
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.bardicInspiration.attack,preCheckHits',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.optional.bardicInspiration.label',
                'mode': 5,
                'value': 'Bardic Inspiration',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.optional.bardicInspiration.save.all',
                'mode': 5,
                'value': scale.formula,
                'priority': 20
            }
        ],
        'duration': {
            'seconds': 600
        },
        'origin': workflow.item.uuid,
        'name': workflow.item.name,
        'flags': {
            'chris-premades': {
                'feature': {
                    'bardicInspiration': scale.formula
                }
            }
        }
    };
    let moteOfPotentialeOfPotential = chris.getItem(workflow.actor, 'Mote of Potential');
    if (moteOfPotentialeOfPotential) {
        effectData.changes = effectData.changes.concat(
            {
                'key': 'flags.midi-qol.optional.bardicInspiration.check.all',
                'mode': 5,
                'value': '2' + scale.die + 'kh',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.optional.bardicInspiration.skill.all',
                'mode': 5,
                'value': '2' + scale.die + 'kh',
                'priority': 20
            } ,
            {
                'key': 'flags.midi-qol.optional.bardicInspiration.macroToCall',
                'mode': 5,
                'value': 'function.chrisPremades.macros.moteOfPotential',
                'priority': 20
            }
        );
        setProperty(effectData, 'flags.chris-premades.feature.moteOfPotential', chris.getSpellDC(workflow.item));
    } else {
        effectData.changes = effectData.changes.concat(
            {
                'key': 'flags.midi-qol.optional.bardicInspiration.check.all',
                'mode': 5,
                'value': scale.formula,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.optional.bardicInspiration.skill.all',
                'mode': 5,
                'value': scale.formula,
                'priority': 20
            }
        );
    }
    let magicalInspiration = chris.getItem(workflow.actor, 'Magical Inspiration');
    if (magicalInspiration) {
        effectData.changes = effectData.changes.concat(
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.bardicInspiration.damage,preDamageApplication',
                'priority': 20
            }

        );
    }
    await chris.createEffect(workflow.targets.first().actor, effectData);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size || workflow.isFumble) return;
    let effect = chris.getEffects(workflow.actor).find(i => i.flags['chris-premades']?.feature?.bardicInspiration);
    if (!effect) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'bardicInspiration', 150);
    if (!queueSetup) return;
    let selection = await chris.dialog(effect.name, constants.yesNo, 'Use ' + effect.name + '? (Attack Total: ' + workflow.attackTotal + ' )');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let bardDice = effect.flags['chris-premades'].feature.bardicInspiration;
    await chris.removeEffect(effect);
    let updatedRoll = await chris.addToRoll(workflow.attackRoll, bardDice);
    workflow.setAttackRoll(updatedRoll);
    let moteOfPotential = effect.flags['chris-premades'].feature.moteOfPotential;
    if (moteOfPotential) {
        let bardDie = updatedRoll.terms[updatedRoll.terms.length - 1].total;
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Mote of Potential Attack', false);
        if (!featureData) {
            queue.remove(workflow.item.uuid);
            return;
        }
        featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Mote of Potential Attack');
        featureData.system.save.dc = moteOfPotential;
        featureData.system.damage.parts = [
            [
                bardDie + '[thunder]',
                'thunder'
            ]
        ];
        let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
        let newTargets = await chris.findNearby(workflow.targets.first(), 5, 'ally', false, true).map(i => i.document.uuid);
        let [config, options] = constants.syntheticItemWorkflowOptions(newTargets);
        await warpgate.wait(100);
        await MidiQOL.completeItemUse(feature, config, options);
    }
    queue.remove(workflow.item.uuid);
}
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size || workflow.item.type != 'spell') return;
    if ((workflow.item.system.actionType === 'rsak' || workflow.item.system.actionType === 'msak') && !workflow.hitTargets.size) return;
    let effect = chris.getEffects(workflow.actor).find(i => i.flags['chris-premades']?.feature?.bardicInspiration);
    if (!effect) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'bardicInspiration', 150);
    if (!queueSetup) return;
    let selection = await chris.selectTarget('Use Magical Inspiration?', constants.yesNoButton, workflow.targets, false, 'one');
    if (!selection.buttons) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let bardDice = effect.flags['chris-premades'].feature.bardicInspiration;
    await chris.removeEffect(effect);
    let targetTokenID = selection.inputs.find(i => i);
    if (!targetTokenID) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let targetDamage = workflow.damageList.find(i => i.tokenId === targetTokenID);
    let defaultDamageType = workflow.damageRolls[0].terms[0].flavor;
    let roll = await new Roll(bardDice + '[' + defaultDamageType + ']').roll({async: true});
    roll.toMessage({
        'rollMode': 'roll',
        'speaker': {'alias': name},
        'flavor': 'Magical Inspiration'
    });
    let targetActor = canvas.scene.tokens.get(targetDamage.tokenId).actor;
    if (!targetActor) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let hasDI = chris.checkTrait(targetActor, 'di', defaultDamageType);
    if (hasDI) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let damageTotal = roll.total;
    let hasDR = chris.checkTrait(targetActor, 'dr', defaultDamageType);
    if (hasDR) damageTotal = Math.floor(damageTotal / 2);
    targetDamage.damageDetail[0].push(
        {
            'damage': damageTotal,
            'type': defaultDamageType
        }
    );
    targetDamage.totalDamage += damageTotal;
    if (defaultDamageType === 'healing') {
        targetDamage.newHP += roll.total;
        targetDamage.hpDamage -= damageTotal;
        targetDamage.appliedDamage -= damageTotal;
    } else {
        targetDamage.appliedDamage += damageTotal;
        targetDamage.hpDamage += damageTotal;
        if (targetDamage.oldTempHP > 0) {
            if (targetDamage.oldTempHP >= damageTotal) {
                targetDamage.newTempHP -= damageTotal;
            } else {
                let leftHP = damageTotal - targetDamage.oldTempHP;
                targetDamage.newTempHP = 0;
                targetDamage.newHP -= leftHP;
            }
        } else {
            targetDamage.newHP -= damageTotal;
        }
    }
    queue.remove(workflow.item.uuid);
}
export let bardicInspiration = {
    'item': item,
    'attack': attack,
    'damage': damage
}