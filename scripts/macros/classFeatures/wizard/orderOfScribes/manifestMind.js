import {tashaSummon} from '../../../../utility/tashaSummon.js';
import {chris} from '../../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Manifest Mind');
    if (!sourceActor) return;
    let name = chris.getConfiguration(workflow.item, 'name') ?? 'Manifest Mind';
    if (name === '') name = 'Manifest Mind';
    let updates = {
        'actor': {
            'name': name,
            'prototypeToken': {
                'name': name,
                'disposition': workflow.token.document.disposition
            }
        },
        'token': {
            'name': name,
            'disposition': workflow.token.document.disposition
        }
    };
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar');
    if (avatarImg) updates.actor.img = avatarImg;
    let tokenImg = chris.getConfiguration(workflow.item, 'token');
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    let manifestMindToken = await tashaSummon.spawn(sourceActor, updates, 86400, workflow.item);
    let moveData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Manifest Mind: Move', false);
    if (!moveData) return;
    moveData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Manifest Mind: Move');
    let castData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Manifest Mind: Cast Spell', false);
    if (!castData) return;
    castData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Manifest Mind: Cast Spell');
    let castUsesValue = workflow.actor.flags['chris-premades']?.feature?.manifestMind;
    if (!castUsesValue) {
        castUsesValue = workflow.actor.system.attributes.prof;
        workflow.actor.setFlag('chris-premades', 'feature.manifestMind', castUsesValue);
    }
    castData.system.uses.value = castUsesValue;
    castData.system.uses.max = workflow.actor.system.attributes.prof;
    let updates2 = {
        'embedded': {
            'Item': {
                [castData.name]: castData,
                [moveData.name]: moveData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Manifest Mind',
        'description': 'Manifest Mind'
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    if (!effect) return;
    let currentScript = effect.flags.effectmacro?.onDelete?.script;
    if (!currentScript) return;
    let effectUpdates = {
        'flags': {
            'effectmacro': {
                'onDelete': { 
                    'script': currentScript + ' await warpgate.revert(token.document, "Manifest Mind");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': castData.name
                },
                'feature': {
                    'manifestMind': manifestMindToken.id
                }
            }
        }
    };
    await chris.updateEffect(effect, effectUpdates);
}
async function attackApply({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = workflow.actor.effects.find((e) => e?.flags['chris-premades']?.feature?.manifestMind);
    if (!effect) return;
    let manifestMindId = effect.flags['chris-premades']?.feature?.manifestMind;
    if (!manifestMindId) return;
    let manifestMindToken = canvas.scene.tokens.get(manifestMindId);
    if (!manifestMindToken) return;
    if (chris.getDistance(workflow.token, manifestMindToken) > 300) {
        ui.notifications.info('Manifest Mind Too Far Away!');
        return;
    }
    let effectData = {
        'label': 'Manifest Mind Spell',
        'icon': '',
        'origin': effect.origin.uuid,
        'duration': {
            'turns': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.rangeOverride.attack.all',
                'mode': 0,
                'value': 1,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'priority': 20,
                'value': 'function.chrisPremades.macros.manifestMind.attackEarly,preambleComplete'
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    '1Attack'
                ],
                'stackable': 'none',
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(workflow.actor, effectData);
    await chris.createEffect(manifestMindToken.actor, effectData);
}
async function attackEarly({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item.type != 'spell') {
        ui.notifications.info('Invalid Action Type!');
        return false;
    }
    let effect = workflow.actor.effects.find((e) => e?.flags['chris-premades']?.feature?.manifestMind);
    if (!effect) return;
    let manifestMindId = effect.flags['chris-premades']?.feature?.manifestMind;
    if (!manifestMindId) return;
    workflow.actor.setFlag('chris-premades', 'feature.manifestMind', workflow.item.system?.uses?.value)
}
async function longRest(actor, data) {
    if (!data.longRest) return;
    if (actor.classes?.wizard?.system?.levels < 6) return;
    let item = actor.items.getName('Order of Scribes');
    if (!item) return;
    if (item.type != 'subclass') return;
    workflow.actor.setFlag('chris-premades', 'feature.manifestMind', actor.system.attributes.prof);
}
export let manifestMind = {
    'item': item,
    'attackApply': attackApply,
    'attackEarly': attackEarly,
    'longRest': longRest,
}