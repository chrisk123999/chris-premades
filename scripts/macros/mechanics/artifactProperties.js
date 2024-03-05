import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function configureDialog(setting) {
    function dialogRender(html) {
        let ths = html[0].getElementsByTagName('th');
        for (let t of ths) {
            t.style.width = 'auto';
            t.style.textAlign = 'left';
        }
        let tds = html[0].getElementsByTagName('td');
        for (let t of tds) {
            t.style.width = '340px';
            t.style.textAlign = 'right';
            t.style.paddingRight = '5px';
        }
    }
    let oldSettings = game.settings.get('chris-premades', setting);
    let inputs = Object.entries(oldSettings).map(i => ({'label': i[0] + ':', 'type': 'text', 'options': i[1]}));
    let selection = await chris.menu(setting, constants.okCancel, inputs, false, undefined, undefined, {'render': dialogRender});
    if (!selection.buttons) return;
    let newSettings = {};
    for (let i = 0; i < Object.keys(oldSettings).length; i++) {
        newSettings[Object.keys(oldSettings)[i]] = selection.inputs[i];
    }
    await game.settings.set('chris-premades', setting, newSettings);
}
async function selectOrRollProperty(item) {
    let options = [
        ['Minor Beneficial Property', 'Minor Beneficial Properties'],
        ['Major Beneficial Property', 'Major Beneficial Properties'],
//        ['Minor Detrimental Property', 'Minor Detrimental Properties'],
//        ['Major Detrimental Property', 'Major Detrimental Properties']
    ];
    let selection = await chris.dialog('Artifact Properties', options, 'Apply what type of artifact property?');
    if (!selection) return;
    let selection2 = await chris.dialog('Artifact Properties', [['Roll', 'roll'], ['Select', 'select']]);
    if (!selection2) return;
    let property;
    let options2 = game.settings.get('chris-premades', selection);
    if (selection2 === 'roll') {
        let roll = await new Roll('1d100').evaluate({'async': true});
        let value;
        switch(selection) {
            case 'Minor Beneficial Properties':
            case 'Major Beneficial Properties':
                if (roll.total <= 20) {
                    property = '01-20';
                } else {
                    value = Math.ceil((roll.total + 1) / 10) * 10;
                    property = String(value - 9).padStart(2, '0') + '-' + (value === 100 ? '00' : String(value));
                }
                break;
            case 'Minor Detrimental Properties':
            case 'Major Detrimental Properties':
                value = Math.ceil((roll.total + 1) / 5) * 5;
                property = String(value - 5).padStart(2, '0') + '-' + (value === 100 ? '00' : String(value));
                break;
        }
        roll.toMessage({
            'rollMode': 'roll',
            'speaker': {'alias': name},
            'flavor': options2[property]
        });
    } else {
        property = await chris.dialog('Artifact Properties', Object.entries(options2).map(i => [i[1], i[0]]), 'Select an artifact property:');
        if (!property) return;
    }
    let effectData;
    let selection3;
    async function addEffect(effectData) {
        effectData.transfer = true;
        setProperty(effectData, 'flags.chris-premades.artifact', true);
        //effectData.origin = item.uuid;
        effectData.icon = item.img;
        let itemData = duplicate(item.toObject());
        let effects = itemData.effects;
        effects.push(effectData);
        await item.update({'effects': effects});
    }
    async function addSpell(level) {
        let packId = game.settings.get('chris-premades', 'Spell Compendium');
        let pack = game.packs.get(packId);
        if (!pack) {
            ui.notifications.warn('Personal Spell Compendium not found!');
            return;
        }
        let index = await pack.getIndex({'fields': ['uuid', 'system.level']});
        let documents = index.contents.filter(i => i.system?.level === level);
        let selection = await chris.selectDocument('Artifact Properties', documents, false, false);
        if (!selection) return;
        let document = await fromUuid(selection[0].uuid);
        if (!document) return;
        let documentData = duplicate(document.toObject());
        delete documentData._id;
        if (!game.settings.get('chris-premades', 'Artifact Spell Action')) {
            documentData.system.activation.type = 'action';
        }
        documentData.system.preparation.mode = 'atwill';
        if (level > 0) {
            documentData.system.uses = {
                'value': 1,
                'max': 1,
                'per': 'dawn',
                'recovery': '1',
                'prompt': true
            };
            let midiFlags = documentData.flags['midi-qol'] ?? {'onUseMacroName': ''};
            if (!midiFlags.onUseMacroName) midiFlags.onUseMacroName = '';
            midiFlags.onUseMacroName += ',[postActiveEffects]function.chrisPremades.macros.artifactProperties.rechargeOn6';
            setProperty(documentData, 'flags.midi-qol', midiFlags);
        }
        setProperty(documentData, 'flags.custom-character-sheet-sections.sectionName', item.name + ' Spells');
        let wasEquipped = item.system.equipped;
        let chrisFeatures = item.flags?.['chris-premades']?.equipment.items ?? [];
        chrisFeatures.push({
            'name': documentData.name,
            'uniqueName': 'artifact-' + randomID(),
            'documentData': documentData
        });
        let updates = {
            'system.equipped': false,
            'flags.chris-premades.equipment.items': chrisFeatures
        };
        await item.update(updates);
        if (wasEquipped) {
            await warpgate.wait(50);
            await item.update({'system.equipped': true});
        }
    }
    if (selection === 'Minor Beneficial Properties') {
        switch(property) {
            case '01-20':
                selection3 = await chris.dialog('Artifact Properties', Object.entries(CONFIG.DND5E.skills).map(i => [i[1].label, i[0]]), 'Select a skill:');
                if (!selection3) return;
                effectData = {
                    'name': item.name + ' - Artifact Property: Skill Proficiency',
                    'changes': [
                        {
                            'key': 'system.skills.' + selection3 + '.value',
                            'mode': 4,
                            'value': 1,
                            'priority': 20
                        }
                    ]
                };
                await addEffect(effectData);
                return;
            case '21-30':
                effectData = {
                    'name': item.name + ' - Artifact Property: Disease Immunity',
                    'changes': [
                        {
                            'key': 'system.traits.ci.value',
                            'mode': 2,
                            'value': 'diseased',
                            'priority': 20
                        }
                    ]
                };
                await addEffect(effectData);
                return;
            case '31-40':
                effectData = {
                    'name': item.name + ' - Artifact Property: Charmed & Frightened Immunity',
                    'changes': [
                        {
                            'key': 'system.traits.ci.value',
                            'mode': 2,
                            'value': 'charmed',
                            'priority': 20
                        },
                        {
                            'key': 'system.traits.ci.value',
                            'mode': 2,
                            'value': 'frightened',
                            'priority': 20
                        }
                    ]
                };
                await addEffect(effectData);
                return;
            case '41-50':
                selection3 = await chris.dialog('Artifact Properties', constants.damageTypeMenu(), 'Select a damage resistance:');
                if (!selection3) return;
                effectData = {
                    'name': item.name + ' - Artifact Property: Damage Resistance',
                    'changes': [
                        {
                            'key': 'system.traits.dr.value',
                            'mode': 2,
                            'value': selection3,
                            'priority': 20
                        }
                    ]
                };
                await addEffect(effectData);
                return;
            case '51-60':
                await addSpell(0);
                return;
            case '61-70':
                await addSpell(1);
                return;
            case '71-80':
                await addSpell(2);
                return;
            case '81-90':
                await addSpell(3);
                return;
            case '91-00':
                effectData = {
                    'name': item.name + ' - Artifact Property: Bonus AC',
                    'changes': [
                        {
                            'key': 'system.attributes.ac.bonus',
                            'mode': 2,
                            'value': '+1',
                            'priority': 20
                        }
                    ]
                };
                await addEffect(effectData);
                return;
        }
    } else if (selection === 'Major Beneficial Properties') {
        switch(property) {
            case '01-20': 
                selection3 = await chris.dialog('Artifact Properties', Object.entries(CONFIG.DND5E.abilities).map(i => [i[1].label, i[0]]), 'Select an ability:');
                if (!selection3) return;
                effectData = {
                    'name': item.name + ' - Artifact Property: Ability Score Bonus',
                    'changes': [
                        {
                            'key': 'system.abilities.' + selection3 + '.value',
                            'mode': 2,
                            'value': '+2',
                            'priority': 20
                        }
                    ]
                };
                await addEffect(effectData);
                return;
            case '21-30':
                effectData = {
                    'name': item.name + ' - Artifact Property: Regeneration',
                    'flags': {
                        'effectmacro': {
                            'onTurnStart': {
                                'script': 'await chrisPremades.macros.artifactProperties.regeneration(token, effect);'
                            }
                        }
                    }
                };
                await addEffect(effectData);
                return;
            case '31-40':
                effectData = {
                    'name': item.name + ' - Artifact Property: Bonus Weapon Damage',
                    'changes': [
                        {
                            'key': 'flags.midi-qol.onUseMacroName',
                            'mode': 0,
                            'value': 'function.chrisPremades.macros.artifactProperties.bonusDamage,postDamageRoll',
                            'priority': 20
                        }
                    ]
                };
                await addEffect(effectData);
                return;
            case '41-50':
                effectData = {
                    'name': item.name + ' - Artifact Property: Walking Speed Bonus',
                    'changes': [
                        {
                            'key': 'system.attributes.movement.walk',
                            'mode': 2,
                            'value': '+10',
                            'priority': 20
                        }
                    ]
                };
                await addEffect(effectData);
                return;
            case '51-60':
                await addSpell(4);
                return;
            case '61-70':
                await addSpell(5);
                return;
            case '71-80':
                await addSpell(6);
                return;
            case '81-90':
                await addSpell(7);
                return;
            case '91-00':
                effectData = {
                    'name': item.name + ' - Artifact Property: Blinded, Deafened, Petrified, & Stunned Immunity',
                    'changes': [
                        {
                            'key': 'system.traits.ci.value',
                            'mode': 2,
                            'value': 'blinded',
                            'priority': 20
                        },
                        {
                            'key': 'system.traits.ci.value',
                            'mode': 2,
                            'value': 'deafened',
                            'priority': 20
                        },
                        {
                            'key': 'system.traits.ci.value',
                            'mode': 2,
                            'value': 'petrified',
                            'priority': 20
                        },
                        {
                            'key': 'system.traits.ci.value',
                            'mode': 2,
                            'value': 'stunned',
                            'priority': 20
                        }
                    ]
                };
                await addEffect(effectData);
                return;
        }
    }
}
async function rechargeOn6({speaker, actor, token, character, item, args, scope, workflow}) {
    let roll = await new Roll('1d6').evaluate({'async': true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {'alias': name},
        flavor: 'Recharge: ' + workflow.item.name
    });
    if (roll.total === 6) await workflow.item.update({'system.uses.value': 1});
}
async function regeneration(token, effect) {
    if (!token.actor.system.attributes.hp.value) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Artifact Properties: Regeneration', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Artifact Properties: Regeneration');
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': token.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([token.document.uuid]);
    let queueSetup = await queue.setup(effect.uuid, 'artifactRegeneration', 50);
    if (!queueSetup) return;
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
    queue.remove(effect.uuid);
}
async function bonusDamage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'artifactBonusDamage', 250);
    if (!queueSetup) return;
    let bonusDamageFormula = '1d6[' + workflow.defaultDamageType + ']';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);
    queue.remove(workflow.item.uuid);
}

export let artifactProperties = {
    'configureDialog': configureDialog,
    'selectOrRollProperty': selectOrRollProperty,
    'rechargeOn6': rechargeOn6,
    'regeneration': regeneration,
    'bonusDamage': bonusDamage
}