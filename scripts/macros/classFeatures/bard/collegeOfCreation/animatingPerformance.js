import {tashaSummon} from '../../../../utility/tashaSummon.js';
import {chris} from '../../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let selection = await chris.dialog('What item size?', [['Large', 'lg'], ['Medium', 'med'], ['Small', 'sm'], ['Tiny','tiny']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Dancing Item');
    if (!sourceActor) return;
    let irrpressibleFormData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Irrepressible Dance', false);
    if (!irrpressibleFormData) return;
    irrpressibleFormData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Irrepressible Dance');
    let immutableFormData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Immutable Form', false);
    if (!immutableFormData) return;
    immutableFormData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Immutable Form');
    let forceEmpoweredSlamData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Force-Empowered Slam', false);
    if (!forceEmpoweredSlamData) return;
    forceEmpoweredSlamData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Force-Empowered Slam');
    let dodgeData = await chris.getItemFromCompendium('chris-premades.CPR Actions', 'Dodge', false);
    if (!dodgeData) return;
    dodgeData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dodge');
    let bardLevel = workflow.actor.classes?.bard?.system?.levels;
    if (!bardLevel) return;
    let hpFormula = 10 + 5 * bardLevel;
    let heightWidth;
    let scale;
    switch (selection) {
        case 'tiny': 
            scale = '0.5';
            heightWidth = '1';
            break;  
        case 'sm':
            scale = '0.8';
            heightWidth = '1';
            break;
        case 'med':
            scale = '1';
            heightWidth = '1';
            break;
        case 'lg':
            scale = '1';
            heightWidth = 2;
            break;
    }
    let name = 'Dancing Item';
    let updates = {
        'actor': {
            'name': name,
            'system': {
                'details': {
                    'cr': tashaSummon.getCR(workflow.actor.system.attributes.prof)
                },
                'attributes': {
                    'hp': {
                        'formula': hpFormula,
                        'max': hpFormula,
                        'value': hpFormula
                    }
                }
            },
            'prototypeToken': {
                'name': name
            },
            'flags': {
                'chris-premades': {
                    'summon': {
                        'attackBonus': {
                            'melee': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.str.mod + Number(workflow.actor.system.bonuses.msak.attack),
                            'ranged': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.str.mod + Number(workflow.actor.system.bonuses.rsak.attack)
                        }
                    }
                }
            },
            'traits': {
                'size': selection
            },
        },
        'token': {
            'name': name,
            'height': heightWidth,
            'width': heightWidth,
            'texture': {
                'scaleX': scale,
                'scaleY': scale
            }
        },
        'embedded': {
            'Item': {
                [irrpressibleFormData.name]: irrpressibleFormData,
                [immutableFormData.name]: immutableFormData,
                [forceEmpoweredSlamData.name]: forceEmpoweredSlamData,
                [dodgeData.name]: dodgeData,
            }
        }
    };
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar');
    if (avatarImg) updates.actor.img = avatarImg;
    let tokenImg = chris.getConfiguration(workflow.item, 'token');
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    await tashaSummon.spawn(sourceActor, updates, 3600, workflow.item);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Animating Performance - Command', false);
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Animating Performance - Command');
    if (!featureData) return;
    let updates2 = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': name,
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
    let effect = chris.findEffect(workflow.actor, 'Animating Performance');
    if (!effect) return;
    let currentScript = effect.flags.effectmacro?.onDelete?.script;
    if (!currentScript) return;
    let effectUpdates = {
        'flags': {
            'effectmacro': {
                'onDelete': { 
                    'script': currentScript + ' await warpgate.revert(token.document, "' + name + '");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                }
            }
        }
    };
    await chris.updateEffect(effect, effectUpdates);
}
async function irrepressibleDance(token, origin) {
    if (token.actor.system.attributes.hp.value === 0) return;
    if (!game.combat.current.tokenId) return;
    let targetToken = game.canvas.tokens.get(game.combat.current.tokenId);
    if (!targetToken) return;
    if (targetToken.id === token.id) return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > 10) return;
    let speedValue = 10;
    let disposition = targetToken.document.disposition;
    if (disposition === -1) speedValue = -10;
    let effect = chris.findEffect(targetToken.actor, 'Irrepressible Dance');
    if (effect) await chris.removeEffect(effect);
    let effectData = {
        'label': 'Irrepressible Dance',
        'icon': origin.img,
        'origin': origin.uuid,
        'duration': {
            'turns': 1
        },
        'changes': [
            {
                'key': 'system.attributes.movement.walk',
                'mode': 2,
                'value': speedValue,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'combatEnd'
                ],
                'stackable': 'none',
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(targetToken.actor, effectData);
}
export let animatingPerformance = {
    'item': item,
    'irrepressibleDance': irrepressibleDance,
}