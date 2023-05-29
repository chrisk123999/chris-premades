import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function stormAvatar({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.item.type != 'weapon') return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'stormAvatar', 340);
    if (!queueSetup) return;
    let damageFormula = workflow.damageRoll._formula.toLowerCase().replace('slashing', 'lightning').replace('piercing', 'lightning').replace('bludgeoning', 'thunder');
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
	let level = workflow.actor.flags['chris-premades']?.item?.stormgirdle?.level;
	if (level === undefined) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Storm Avatar Lightning', false);
    if (!featureData) return;
    let diceNumber = 3 + level;
    featureData.system.damage.parts = [
        [
            diceNumber + 'd6[lightning]',
            'lightning'
        ]
    ];
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Storm Avatar Lightning');
    async function effectMacro () {
		await warpgate.revert(token.document, 'Storm Avatar');
	}
    let changes = [
        {
            'key': 'system.traits.di.value',
            'mode': 0,
            'value': 'lightning',
            'priority': 20
        },
        {
            'key': 'system.traits.di.value',
            'mode': 0,
            'value': 'thunder',
            'priority': 20
        },
        {
            'key': 'flags.midi-qol.onUseMacroName',
            'mode': 0,
            'value': 'function.chrisPremades.macros.stormgirdle.stormAvatar,postDamageRoll',
            'priority': 20
        }
    ];
    if (level > 0) {
        changes.push({
            'key': 'system.attributes.movement.fly',
            'mode': 2,
            'value': 30,
            'priority': 20
        },
        {
            'key': 'system.attributes.movement.hover',
            'mode': 0,
            'value': 1,
            'priority': 20
        });
    }
    let effectData = {
        'label': 'Storm Avatar',
        'icon': 'icons/magic/lightning/fist-unarmed-strike-blue.webp',
        'changes': changes,
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
            'autoanimations': {
                'label': 'Storm Avatar',
                'activeEffectType': 'ontoken',
                'menu': 'aefx',
                'macro': {
                    'enable': false,
                    'playWhen': '0'
                },
                'primary': {
                    'video': {
                        'dbSection': 'static',
                        'menuType': 'marker',
                        'animation': 'energystrand',
                        'variant': '01',
                        'color': 'blue',
                        'enableCustom': false,
                        'customPath': ''
                    },
                    'options': {
                        'addTokenWidth': false,
                        'anchor': '0.5',
                        'delay': 0,
                        'elevation': 1000,
                        'fadeIn': 250,
                        'fadeOut': 500,
                        'isMasked': false,
                        'isRadius': false,
                        'isWait': false,
                        'opacity': 1,
                        'persistent': true,
                        'playbackRate': 1,
                        'playOn': 'source',
                        'repeat': 1,
                        'repeatDelay': 250,
                        'size': 1,
                        'unbindAlpha': false,
                        'unbindVisibility': false,
                        'zIndex': 1
                    },
                    'sound': {
                        'enable': false,
                        'delay': 0,
                        'repeat': 1,
                        'repeatDelay': 250,
                        'startTime': 0,
                        'volume': 0.75
                    }
                },
                'secondary': {
                    'enable': false,
                    'video': {
                        'dbSection': 'static',
                        'menuType': 'spell',
                        'animation': 'curewounds',
                        'variant': '01',
                        'color': 'blue',
                        'enableCustom': false,
                        'customPath': ''
                    },
                    'sound': {
                        'enable': false,
                        'delay': 0,
                        'repeat': 1,
                        'repeatDelay': 250,
                        'startTime': 0,
                        'volume': 0.75
                    },
                    'options': {
                        'addTokenWidth': false,
                        'anchor': '0.5',
                        'delay': 0,
                        'elevation': 1000,
                        'fadeIn': 250,
                        'fadeOut': 500,
                        'isMasked': false,
                        'isRadius': true,
                        'isWait': false,
                        'opacity': 1,
                        'repeat': 1,
                        'repeatDelay': 250,
                        'size': 1.5,
                        'zIndex': 1
                    }
                },
                'soundOnly': {
                    'sound': {
                        'enable': false,
                        'delay': 0,
                        'repeat': 1,
                        'repeatDelay': 250,
                        'startTime': 0,
                        'volume': 0.75
                    }
                },
                'source': {
                    'enable': false,
                    'video': {
                        'dbSection': 'static',
                        'menuType': 'spell',
                        'animation': 'curewounds',
                        'variant': '01',
                        'color': 'blue',
                        'enableCustom': false,
                        'customPath': ''
                    },
                    'sound': {
                        'enable': false,
                        'delay': 0,
                        'repeat': 1,
                        'repeatDelay': 250,
                        'startTime': 0,
                        'volume': 0.75
                    },
                    'options': {
                        'addTokenWidth': false,
                        'anchor': '0.5',
                        'delay': 0,
                        'elevation': 1000,
                        'fadeIn': 250,
                        'fadeOut': 500,
                        'isMasked': false,
                        'isRadius': false,
                        'isWait': true,
                        'opacity': 1,
                        'repeat': 1,
                        'repeatDelay': 250,
                        'size': 1,
                        'zIndex': 1
                    }
                },
                'isEnabled': true,
                'isCustomized': true,
                'version': 5
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
        'name': 'Storm Avatar',
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
async function equip(actor, origin) {
    let spellData = await chris.getItemFromCompendium(game.settings.get('chris-premades', 'Spell Compendium'), 'Control Weather', false);
    if (!spellData) return;
    let charges = origin.flags['chris-premades']?.item?.stormgirdle?.charges;
    if (charges === undefined) charges = 1;
    spellData.system.uses.per = 'day';
    spellData.system.uses.max = 1;
    spellData.system.uses.value = charges;
    spellData.system.preparation.mode = 'atwill';
    spellData.system.preparation.prepared = true;
    await chris.addTempItem(actor, spellData, origin.id, 'Stormgirdle', false, 0);
}
async function unequip(actor, origin) {
    let charges = 1;
    let tempItem = chris.getTempItem(actor, origin.id, 0);
    if (tempItem) charges = tempItem.system.uses.value;
    await origin.setFlag('chris-premades', 'item.stormgirdle.charges', charges);
    await chris.removeTempItems(actor, origin.id);
}
async function deleted(actor, effect) {
    if (effect.disabled) return;
    let originArray = effect.origin.split('Item.');
    if (originArray.length != 2) return;
    let originID = originArray[1];
    await chris.removeTempItems(actor, originID);
}
export let stormgirdle = {
    'item': item,
    'stormAvatar': stormAvatar,
    'equip': equip,
    'unequip': unequip,
    'deleted': deleted
}