import {chris} from '../../../../helperFunctions.js';
async function effectMacro() {
    await chrisPremades.macros.mutagencraft.remove(origin);
}
async function celerity({speaker, actor, token, character, item, args, scope, workflow}) {
    let classLevels = workflow.actor.classes['blood-hunter']?.system?.levels;
    if (!classLevels) return;
    let effectData = {
        'label': 'Mutagen - Celerity: Positive Effects',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'system.abilities.dex.value',
                'value': '+3',
                'mode': 2,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'longRest',
                    'shortRest'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            },
            'effectmacro': {
				'onDelete': {
					'script': chris.functionToString(effectMacro)
				}
			}
        }
    }
    if (classLevels >= 11 && classLevels < 18) effectData.changes[0].value = '+4';
    else if (classLevels >= 18) effectData.changes[0].value = '+5';
    await chris.createEffect(workflow.actor, effectData);
}
async function mobility({speaker, actor, token, character, item, args, scope, workflow}) {
    let classLevels = workflow.actor.classes['blood-hunter']?.system?.levels;
    if (!classLevels) return;
    let effectData = {
        'label': 'Mutagen - Mobility: Positive Effects',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'system.traits.ci.value',
                'value': 'grappled',
                'mode': 0,
                'priority': 20
            },
            {
                'key': 'system.traits.ci.value',
                'value': 'restrained',
                'mode': 0,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'longRest',
                    'shortRest'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            },
            'effectmacro': {
				'onDelete': {
					'script': chris.functionToString(effectMacro)
				}
			}
        }
    }
    if (classLevels >= 11 && classLevels < 18) effectData.changes.push({
        'key': 'system.traits.ci.value',
        'value': 'paralyzed',
        'mode': 0,
        'priority': 20
    });
    await chris.createEffect(workflow.actor, effectData);
}
async function potency({speaker, actor, token, character, item, args, scope, workflow}) {
    let classLevels = workflow.actor.classes['blood-hunter']?.system?.levels;
    if (!classLevels) return;
    let effectData = {
        'label': 'Mutagen - Potency: Positive Effects',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'system.abilities.str.value',
                'value': '+3',
                'mode': 2,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'longRest',
                    'shortRest'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            },
            'effectmacro': {
				'onDelete': {
					'script': chris.functionToString(effectMacro)
				}
			}
        }
    }
    if (classLevels >= 11 && classLevels < 18) effectData.changes[0].value = '+4';
    else if (classLevels >= 18) effectData.changes[0].value = '+5';
    await chris.createEffect(workflow.actor, effectData);
}
async function rapidity({speaker, actor, token, character, item, args, scope, workflow}) {
    let classLevels = workflow.actor.classes['blood-hunter']?.system?.levels;
    if (!classLevels) return;
    let effectData = {
        'label': 'Mutagen - Rapidity: Positive Effects',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'system.attributes.movement.all',
                'value': '+10',
                'mode': 0,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'longRest',
                    'shortRest'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            },
            'effectmacro': {
				'onDelete': {
					'script': chris.functionToString(effectMacro)
				}
			}
        }
    }
    if (classLevels >= 11 && classLevels < 18) effectData.changes[0].value = '+4';
    else if (classLevels >= 18) effectData.changes[0].value = '+15';
    await chris.createEffect(workflow.actor, effectData);
}
async function reconstruction(token, actor) {
    let currentHP = actor.system.attributes.hp.value;
    let maxHalfHP = Math.floor(actor.system.attributes.hp.max / 2);
    if (currentHP > maxHalfHP || actor.system.attributes.hp.value === 0) return;
    await chris.applyDamage([token], actor.system.attributes.prof, 'healing');
}
async function sagacity({speaker, actor, token, character, item, args, scope, workflow}) {
    let classLevels = workflow.actor.classes['blood-hunter']?.system?.levels;
    if (!classLevels) return;
    let effectData = {
        'label': 'Mutagen - Sagacity: Positive Effects',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'system.abilities.int.value',
                'value': '+3',
                'mode': 2,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'longRest',
                    'shortRest'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            },
            'effectmacro': {
				'onDelete': {
					'script': chris.functionToString(effectMacro)
				}
			}
        }
    }
    if (classLevels >= 11 && classLevels < 18) effectData.changes[0].value = '+4';
    else if (classLevels >= 18) effectData.changes[0].value = '+5';
    await chris.createEffect(workflow.actor, effectData);
}
async function createMutagen({speaker, actor, token, character, item, args, scope, workflow}) {
    let generatedMenu = [];
    if (workflow.actor.items.getName('Formulas: Aether')) generatedMenu.push(['Aether', 'Formulas: Aether']);
    if (workflow.actor.items.getName('Formulas: Alluring')) generatedMenu.push(['Alluring', 'Formulas: Alluring']);
    if (workflow.actor.items.getName('Formulas: Celerity')) generatedMenu.push(['Celerity', 'Formulas: Celerity']);
    if (workflow.actor.items.getName('Formulas: Conversant')) generatedMenu.push(['Conversant', 'Formulas: Conversant']);
    if (workflow.actor.items.getName('Formulas: Cruelty')) generatedMenu.push(['Cruelty', 'Formulas: Cruelty']);
    if (workflow.actor.items.getName('Formulas: Deftness')) generatedMenu.push(['Deftness', 'Formulas: Deftness']);
    if (workflow.actor.items.getName('Formulas: Embers')) generatedMenu.push(['Embers', 'Formulas: Embers']);
    if (workflow.actor.items.getName('Formulas: Gelid')) generatedMenu.push(['Gelid', 'Formulas: Gelid']);
    if (workflow.actor.items.getName('Formulas: Impermeable')) generatedMenu.push(['Impermeable', 'Formulas: Impermeable']);
    if (workflow.actor.items.getName('Formulas: Mobility')) generatedMenu.push(['Mobility', 'Formulas: Mobility']);
    if (workflow.actor.items.getName('Formulas: Nighteye')) generatedMenu.push(['Nighteye', 'Formulas: Nighteye']);
    if (workflow.actor.items.getName('Formulas: Percipient')) generatedMenu.push(['Percipient', 'Formulas: Percipient']);
    if (workflow.actor.items.getName('Formulas: Potency')) generatedMenu.push(['Potency', 'Formulas: Potency']);
    if (workflow.actor.items.getName('Formulas: Precision')) generatedMenu.push(['Precision', 'Formulas: Precision']);
    if (workflow.actor.items.getName('Formulas: Rapidity')) generatedMenu.push(['Rapidity', 'Formulas: Rapidity']);
    if (workflow.actor.items.getName('Formulas: Reconstruction')) generatedMenu.push(['Reconstruction', 'Formulas: Reconstruction']);
    if (workflow.actor.items.getName('Formulas: Sagacity')) generatedMenu.push(['Sagacity', 'Formulas: Sagacity']);
    if (workflow.actor.items.getName('Formulas: Shielded')) generatedMenu.push(['Shielded', 'Formulas: Shielded']);
    if (workflow.actor.items.getName('Formulas: Unbreakable')) generatedMenu.push(['Unbreakable', 'Formulas: Unbreakable']);
    if (workflow.actor.items.getName('Formulas: Vermillion')) generatedMenu.push(['Vermillion', 'Formulas: Vermillion']);
    if (generatedMenu.length === 0) return;
    let selection = await chris.dialog('What Mutagen do you create?', generatedMenu);
    if (!selection) return;
    let feature = workflow.actor.items.getName(selection);
    if (!feature) return;
    let uses = feature.system.uses.value + 1;
    let max = Number(feature.system.uses.max + 1);
    await feature.update(
        {
            'system.uses.value': uses,
            'system.uses.max': max
        }
    );
}
async function remove(origin) {
    let max = Number(origin.system.uses.max) - 1;
    await origin.update(
        {
            'system.uses.max': max
        }
    );
}
async function strangeMetabolism({speaker, actor, token, character, item, args, scope, workflow}) {
    let effects = workflow.actor.effects.filter(effect => effect.label.includes('Mutagen - '))
    let generatedMenu = [];
    for (let i of effects) {
        let originItem = await fromUuid(i.origin);
        if (!originItem) continue;
        generatedMenu.push([originItem.name, i.id]);
    }
    if (generatedMenu.length === 0) return;
    let selection;
    if (generatedMenu.length === 1) selection = generatedMenu[0][1];
    if (!selection) selection = await chris.dialog('What Mutagen?', generatedMenu);
    if (!selection) return;
    let effect = workflow.actor.effects.get(selection);
    if (!effect) return;
    await effect.update({'disabled': true});
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        },
        'flags': {
            'effectmacro': {
				'onDelete': {
					'script': 'await actor.effects.get("' + selection + '").update({"disabled": false});'
				}
			}
        }
    }
    await chris.createEffect(workflow.actor, effectData);
}
export let mutagencraft = {
    'celerity': celerity,
    'mobility': mobility,
    'potency': potency,
    'rapidity': rapidity,
    'reconstruction': reconstruction,
    'sagacity': sagacity,
    'createMutagen': createMutagen,
    'remove': remove,
    'strangeMetabolism': strangeMetabolism
}