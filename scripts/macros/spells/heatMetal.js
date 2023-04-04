import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetToken = this.targets.first();
    let damageDice = this.castData.castLevel + 'd8[fire]';
    let targetUuid = targetToken.document.uuid;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Heat Metal Pulse', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Heat Metal Pulse');
    let spellDC = chris.getSpellDC(this.item);
    featureData.flags['chris-premades'] = {
        'spell': {
            'heatMetal': {
                'damageDice': damageDice,
                'targetUuid': targetUuid,
                'spellDC': spellDC,
                'originUuid': this.item.uuid
            },
            'castData': this.castData
        }
    };
    featureData.flags['chris-premades'].spell.castData.school = this.item.system.school;
    async function effectMacro () {
		await warpgate.revert(token.document, 'Heat Metal');
        await chrisPremades.macros.heatMetal.removed(effect);
	}
    let effectData = {
        'label': 'Heat Metal',
        'icon': this.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': this.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'spell': {
                    'heatMetal': {
                        'targetTokenUuid': targetUuid
                    }
                }
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.label]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': effectData.label,
        'description': featureData.name,
        'origin': this.item.uuid
    };
    await warpgate.mutate(this.token.document, updates, {}, options);
    let effectData2 = {
        'label': 'Heat Metal Dialogue',
        'icon': this.item.img,
        'duration': {
            'seconds': 6
        },
        'origin': this.item.uuid,
        'flags': {
            'effectmacro': {
                'onCreate': {
                    'script': 'await chrisPremades.macros.heatMetal.dialogue(token, actor, effect, origin);'
                }
            },
            'chris-premades': {
                'spell': {
                    'heatMetal': {
                        'spellDC': spellDC,
                        'originUuid': this.item.uuid
                    }
                }
            }
        }
    }
    await chris.createEffect(targetToken.actor, effectData2);
}
async function pulseItem({speaker, actor, token, character, item, args}) {
    let targetTokenUuid = this.item.flags['chris-premades']?.spell?.heatMetal?.targetUuid;
    let damageDice = this.item.flags['chris-premades']?.spell?.heatMetal?.damageDice;
    let spellDC = this.item.flags['chris-premades']?.spell?.heatMetal?.spellDC;
    let originUuid = this.item.flags['chris-premades']?.spell?.heatMetal?.originUuid;
    if (!damageDice || !targetTokenUuid || !spellDC || !originUuid) return;
    let targetToken = await fromUuid(targetTokenUuid);
    if (!targetToken) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Heat Metal Damage', false);
    if (!featureData) return;
    featureData.system.damage.parts = [
        [
            damageDice,
            'fire'
        ]
    ];
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Heat Metal Damage');
    let feature = new CONFIG.Item.documentClass(featureData, {parent: this.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetTokenUuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    await MidiQOL.completeItemUse(feature, {}, options);
    let effectData = {
        'label': 'Heat Metal Dialogue',
        'icon': this.item.img,
        'duration': {
            'seconds': 6
        },
        'origin': originUuid,
        'flags': {
            'effectmacro': {
                'onCreate': {
                    'script': 'await chrisPremades.macros.heatMetal.dialogue(token, actor, effect, origin);'
                }
            },
            'chris-premades': {
                'spell': {
                    'heatMetal': {
                        'spellDC': spellDC,
                        'originUuid': originUuid
                    }
                }
            }
        }
    }
    await chris.createEffect(targetToken.actor, effectData);
}
async function dialogue(token, actor, effect, origin) {
    let selection = await chris.dialog('Drop heated object?', [['Yes', true], ['No', false], ['Unable (Armor)', 'unable']]);
    if (selection === true) {
        await effect.delete();
        return;
    }
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Heat Metal Held', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Heat Metal Held');
    let spellDC = effect.flags['chris-premades']?.spell?.heatMetal?.spellDC;
    if (!spellDC) return;
    featureData.system.save.dc = spellDC;
    let spell = new CONFIG.Item.documentClass(featureData, {parent: origin.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [token.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    let heatMetalWorkflow = await MidiQOL.completeItemUse(spell, {}, options);
    if (heatMetalWorkflow.failedSaves.size != 0 && selection != 'unable') {
        await effect.delete();
        return;
    }
    let originUuid = effect.flags['chris-premades']?.spell?.heatMetal?.originUuid;
    if (!originUuid) return;
    let effectData = {
        'label': 'Heat Metal Held',
        'icon': this.item.img,
        'changes': [
            {
                'key': 'flags.midi-qol.disadvantage.attack.all',
                'value': '1',
                'mode': 0,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.disadvantage.ability.all',
                'value': '1',
                'mode': 0,
                'priority': 20
            }
        ],
        'duration': {
            'seconds': 6
        },
        'origin': originUuid,
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'turnStartSource'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(actor, effectData);
    await effect.delete();
}
async function removed(effect) {
    let targetTokenUuid = effect.flags['chris-premades']?.spell?.heatMetal?.targetTokenUuid;
    if (!targetTokenUuid) return;
    let targetToken = await fromUuid(targetTokenUuid);
    if (!targetToken) return;
    let targetEffect = chris.findEffect(targetToken.actor, 'Heat Metal Held');
    if (!targetEffect) return;
    await chris.removeEffect(targetEffect);
}
export let heatMetal = {
    'item': item,
    'pulseItem': pulseItem,
    'dialogue': dialogue,
    'removed': removed
}