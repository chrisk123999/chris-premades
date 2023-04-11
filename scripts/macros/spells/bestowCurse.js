import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function item({speaker, actor, token, character, item, args}) {
    if (this.failedSaves.size != 1) return;
    let choices  = [
        ['Disadvantage on Ability Score', 'Ability'],
        ['Disadvantage on Attacks', 'Attack'],
        ['Waste Turn', 'Turn'],
        ['Extra Damage', 'Damage'],
        ['Other', 'Other']
    ];
    let selection = await chris.dialog('What curse do you bestow?', choices);
    if (!selection) return;
    let castLevel = this.castData.castLevel;
    let duration = 60;
    let concentration = true;
    let featureData = await chrisPremades.helpers.getItemFromCompendium('chris-premades.CPR Spell Features', 'Bestow Curse - ' + selection, false);
    if (!featureData) return;
    featureData.system.description.value = chrisPremades.helpers.getItemDescription('CPR - Descriptions', 'Bestow Curse - ' + selection, false);
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
            if (!ability) return;
            featureData.effects[0].changes[0].key += ability;
            featureData.effects[0].changes[1].key += ability;
            break;
        case 'Damage':
            effectData = {
                'label': featureData.name,
                'icon': featureData.img,
                'origin': this.actor.uuid,
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
                        'value': this.targets.first().id,
                        'priority': 20
                    }
                ]
            };
            if (!isNaN(duration)) effectData.duration.seconds = duration;
            await chris.createEffect(this.actor, effectData);
            break;
        case 'Attack':
            featureData.effects[0].changes[0].value = this.token.actor.uuid;
            break;
        case 'Turn':
            let saveDC = chris.getSpellDC(this.item);
            featureData.effects[0].changes[0].value = 'turn=start,saveAbility=wis,saveMagic=true,saveDC=' + saveDC + ',label="Bestow Curse (Start of Turn)"'
            break;
    }
    let feature = new CONFIG.Item.documentClass(featureData, {parent: this.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [this.targets.first().document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    await MidiQOL.completeItemUse(feature, {}, options);
    let targetEffect = chris.findEffect(this.targets.first().actor, 'Bestow Curse - ' + selection);
    if (!targetEffect) return;
    await chris.updateEffect(targetEffect,
        {
            'origin': this.item.uuid,
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
}
async function damage({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    if (this.actor.flags['chris-premades']?.spell?.bestowCurse?.damage?.target != this.hitTargets.first().id) return;
    let queueSetup = await queue.setup(this.item.uuid, 'bestowCurse', 250);
    if (!queueSetup) return;
    let oldFormula = this.damageRoll._formula;
    let diceNum = 1;
    if (this.isCritical) diceNum = 2;
    let damageFormula = oldFormula + ' + ' + diceNum + 'd8[necrotic]';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}
async function damageApplication({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size < 2) return;
    let targetId = this.actor.flags['chris-premades']?.spell?.bestowCurse?.damage.target;
    if (!targetId) return;
    let queueSetup = await queue.setup(this.item.uuid, 'bestowCurse', 250);
    if (!queueSetup) return;
    let targetDamage = this.damageList.find(i => i.tokenId === targetId);
    if (!targetDamage) return;
    let targetActor = canvas.scene.tokens.get(targetDamage.tokenId).actor;
    if (!targetActor) {
        queue.remove(this.item.uuid);
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
        queue.remove(this.item.uuid);
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
    queue.remove(this.item.uuid);
}
async function attack({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1 || this.disadvantage) return;
    let targetUuid = this.actor.flags['chris-premades']?.spell?.bestowCurse?.attack.target;
    if (!targetUuid) return;
    if (targetUuid != this.targets.first().actor.uuid) return;
    let queueSetup = await queue.setup(this.item.uuid, 'bestowCurse', 50);
	if (!queueSetup) return;
    this.disadvantage = true;
    this.attackAdvAttribution['Bestow Curse'] = true;
    queue.remove(this.item.uuid);
}
async function remove(effect, origin, token) {
    let curseFlags = effect.flags['chris-premades']?.spell?.bestowCurse
    if (!curseFlags) return;
    if (curseFlags.type === 'Damage') {
        let damageEffect = origin.actor.effects.find(eff => eff.label === 'Bestow Curse - Damage' && eff.changes?.[2]?.value === token.id);
        if (damageEffect) await chris.removeEffect(damageEffect);
    }
    if (curseFlags.level < 5) {
        await chris.removeCondition(origin.actor, 'Concentrating');
    }
}
export let bestowCurse = {
    'item': item,
    'damage': damage,
    'damageApplication': damageApplication,
    'attack': attack,
    'remove': remove
}