import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let damageDice = workflow.castData.castLevel + 'd8[fire]';
    let targetUuid = targetToken.document.uuid;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Heat Metal Pulse', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Heat Metal Pulse');
    let spellDC = chris.getSpellDC(workflow.item);
    featureData.flags['chris-premades'] = {
        'spell': {
            'heatMetal': {
                'damageDice': damageDice,
                'targetUuid': targetUuid,
                'spellDC': spellDC,
                'originUuid': workflow.item.uuid
            },
            'castData': workflow.castData
        }
    };
    featureData.flags['chris-premades'].spell.castData.school = workflow.item.system.school;
    async function effectMacro () {
        await warpgate.revert(token.document, 'Heat Metal');
        await chrisPremades.macros.heatMetal.removed(effect);
    }
    let effectData = {
        'label': 'Heat Metal',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
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
                },
                'vae': {
                    'button': featureData.name
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
        'origin': workflow.item.uuid
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    let effectData2 = {
        'label': 'Heat Metal Dialogue',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 6
        },
        'origin': workflow.item.uuid,
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
                        'originUuid': workflow.item.uuid
                    }
                }
            }
        }
    }
    await chris.createEffect(targetToken.actor, effectData2);
}
async function pulseItem({speaker, actor, token, character, item, args, scope, workflow}) {
    let targetTokenUuid = workflow.item.flags['chris-premades']?.spell?.heatMetal?.targetUuid;
    let damageDice = workflow.item.flags['chris-premades']?.spell?.heatMetal?.damageDice;
    let spellDC = workflow.item.flags['chris-premades']?.spell?.heatMetal?.spellDC;
    let originUuid = workflow.item.flags['chris-premades']?.spell?.heatMetal?.originUuid;
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
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetTokenUuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
    await MidiQOL.completeItemUse(feature, {}, options);
    let effectData = {
        'label': 'Heat Metal Dialogue',
        'icon': workflow.item.img,
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
    let spell = new CONFIG.Item.documentClass(featureData, {'parent': origin.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [token.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
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
        'icon': workflow.item.img,
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