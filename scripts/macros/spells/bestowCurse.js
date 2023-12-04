import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'bestowCurse', 50);
    if (!queueSetup) return;
    let choices  = [
        ['Disadvantage on Ability Score', 'Ability'],
        ['Disadvantage on Attacks', 'Attack'],
        ['Waste Turn', 'Turn'],
        ['Extra Damage', 'Damage'],
        ['Other', 'Other']
    ];
    let selection = await chris.dialog('What curse do you bestow?', choices);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let castLevel = workflow.castData.castLevel;
    let duration = 60;
    let concentration = true;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Bestow Curse - ' + selection, false);
    if (!featureData) {
        queue.remove(workflow.item.uuid);
        return;
    }
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Bestow Curse - ' + selection, false);
    let effectData;
    switch (castLevel) {
        case 4:
            duration = 600;
            featureData.system.duration = {
                'units': 'minute',
                'value': 10
            };
            break;
        case 5:
        case 6:
            duration = 28800;
            concentration = false;
            featureData.system.duration = {
                'units': 'hour',
                'value': 8
            };
            break;
        case 7:
        case 8:
            duration = 86400;
            concentration = false;
            featureData.system.duration = {
                'units': 'day',
                'value': 1
            };
            break;
        case 9:
            duration = 'forever';
            concentration = false;
            featureData.system.duration = {
                'units': 'perm',
                'value': ''
            };
            break;
    }
    if (!concentration) featureData.flags.midiProperties.concentration = false;
    switch (selection) {
        case 'Ability':
            let abilityChoices = [
                ['Strength', 'str'],
                ['Dexterity', 'dex'],
                ['Constitution', 'con'],
                ['Intelligence', 'int'],
                ['Wisdom', 'wis'],
                ['Charisma', 'cha']
            ];
            let ability = await chris.dialog('What ability?', abilityChoices);
            if (!ability) {
                queue.remove(workflow.item.uuid);
                return;
            }
            featureData.effects[0].changes[0].key += ability;
            featureData.effects[0].changes[1].key += ability;
            break;
        case 'Damage':
            effectData = {
                'label': featureData.name,
                'icon': featureData.img,
                'origin': workflow.item.uuid,
                'duration': {
                    'seconds': null,
                },
                'changes': [
                    {
                        'key': 'flags.midi-qol.onUseMacroName',
                        'mode': 0,
                        'value': 'function.chrisPremades.macros.bestowCurse.damage,postDamageRoll',
                        'priority': 20
                    },
                    {
                        'key': 'flags.midi-qol.onUseMacroName',
                        'mode': 0,
                        'value': 'function.chrisPremades.macros.bestowCurse.damageApplication,preDamageApplication',
                        'priority': 20
                    },
                    {
                        'key': 'flags.chris-premades.spell.bestowCurse.damage.target',
                        'mode': 5,
                        'value': workflow.targets.first().id,
                        'priority': 20
                    }
                ],
                'flags': {
                    'dae': {
                        'transfer': true
                    }
                }
            };
            if (!isNaN(duration)) effectData.duration.seconds = duration;
            await chris.createEffect(workflow.actor, effectData);
            break;
        case 'Attack':
            featureData.effects[0].changes[0].value = workflow.token.actor.uuid;
            break;
        case 'Turn':
            let saveDC = chris.getSpellDC(workflow.item);
            featureData.effects[0].changes[0].value = 'turn=start,saveAbility=wis,saveMagic=true,saveRemove=false,saveDC=' + saveDC + ',label="Bestow Curse (Start of Turn)"'
            break;
    }
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await MidiQOL.completeItemUse(feature, config, options);
    let targetEffect = chris.findEffect(workflow.targets.first().actor, 'Bestow Curse - ' + selection);
    if (!targetEffect) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await chris.updateEffect(targetEffect,
        {
            'origin': workflow.item.uuid,
            'flags': {
                'chris-premades': {
                    'spell': {
                        'bestowCurse': {
                            'level': castLevel,
                            'type': selection
                        }
                    }
                }
            }
        }
    );
    if (concentration) {
        let concentrationEffect = chris.findEffect(workflow.actor, 'Concentrating');
        if (!concentrationEffect) {
            queue.remove(workflow.item.uuid);
            return;
        }
        await chris.updateEffect(concentrationEffect, {'origin': workflow.item.uuid, 'flags.midi-qol.isConcentration': workflow.item.uuid});
        await workflow.actor.setFlag('midi-qol', 'concentration-data.uuid', workflow.item.uuid);

    }
    queue.remove(workflow.item.uuid);

}
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.actor.flags['chris-premades']?.spell?.bestowCurse?.damage?.target != workflow.hitTargets.first().id) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'bestowCurse', 250);
    if (!queueSetup) return;
    let oldFormula = workflow.damageRoll._formula;
    let bonusDamageFormula = '1d8[necrotic]';
    if (workflow.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
    let damageFormula = oldFormula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function damageApplication({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size < 2) return;
    let targetId = workflow.actor.flags['chris-premades']?.spell?.bestowCurse?.damage.target;
    if (!targetId) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'bestowCurse', 250);
    if (!queueSetup) return;
    let targetDamage = workflow.damageList.find(i => i.tokenId === targetId);
    if (!targetDamage) return;
    let targetActor = canvas.scene.tokens.get(targetDamage.tokenId).actor;
    if (!targetActor) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let damageRoll = await new Roll('1d8[necrotic]').roll({async: true});
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: 'Bestow Curse Damage'
    });
    let hasDI = chris.checkTrait(targetActor, 'di', 'necrotic');
    if (hasDI) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let damageTotal = damageRoll.total;
    let hasDR = chris.checkTrait(targetActor, 'dr', 'necrotic');
    if (hasDR) damageTotal = Math.floor(damageTotal / 2);
    targetDamage.damageDetail[0].push(
        {
            'damage': damageTotal,
            'type': 'necrotic'
        }
    );
    targetDamage.totalDamage += damageTotal;
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
    queue.remove(workflow.item.uuid);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.disadvantage) return;
    let targetUuid = workflow.actor.flags['chris-premades']?.spell?.bestowCurse?.attack.target;
    if (!targetUuid) return;
    if (targetUuid != workflow.targets.first().actor.uuid) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'bestowCurse', 50);
    if (!queueSetup) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add('Disadvantage: Bestow Curse');
    queue.remove(workflow.item.uuid);
}
async function remove(effect, origin, token) {
    let curseFlags = effect.flags['chris-premades']?.spell?.bestowCurse
    if (!curseFlags) return;
    await warpgate.wait(200);
    if (curseFlags.type === 'Damage') {
        let damageEffect = origin.actor.effects.find(eff => eff.name === 'Bestow Curse - Damage' && eff.changes?.[2]?.value === token.id);
        if (damageEffect) await chris.removeEffect(damageEffect);
    }
    if (curseFlags.level < 5) {
        let effect2 = chris.findEffect(origin.actor, 'Concentrating');
        if (effect2) await chris.removeEffect(effect2);
    }
}
export let bestowCurse = {
    'item': item,
    'damage': damage,
    'damageApplication': damageApplication,
    'attack': attack,
    'remove': remove
}