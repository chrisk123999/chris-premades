import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {tashaSummon} from '../../../../utility/tashaSummon.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Echo Knight');
    if (!sourceActor) return;
    let sceneEchos = canvas.scene.tokens.filter(i => i.actor?.flags?.['chris-premades']?.feature?.manifestEcho?.ownerUuid === workflow.actor.uuid);
    if (sceneEchos.length) {
        let legionOfOne = chris.getItem(workflow.actor, 'Legion of One');
        let max = legionOfOne ? 2: 1;
        if (sceneEchos.length >= max) for (let i of sceneEchos) await warpgate.dismiss(i.id);
    }
    let name = chris.getConfiguration(workflow.item, 'name');
    if (name === '' || !name) name = workflow.actor.name + ' Echo';
    let actorData = duplicate(workflow.actor.toObject());
    let updates = {
        'actor': {
            'name': name,
            'system': {
                'abilities': {
                    'str': {
                        'value': workflow.actor.system.abilities.str.value
                    },
                    'con': {
                        'value': workflow.actor.system.abilities.con.value
                    },
                    'dex': {
                        'value': workflow.actor.system.abilities.dex.value
                    },
                    'int': {
                        'value': workflow.actor.system.abilities.int.value
                    },
                    'wis': {
                        'value': workflow.actor.system.abilities.wis.value
                    },
                    'cha': {
                        'value': workflow.actor.system.abilities.cha.value
                    }
                },
                'details': {
                    'cr': tashaSummon.getCR(workflow.actor.system.attributes.prof),
                    'type': {
                        'value': chris.raceOrType(workflow.actor)
                    }
                },
                'attributes': {
                    'ac': {
                        'flat': 14 + workflow.actor.system.attributes.prof
                    }
                }
            },
            'prototypeToken': {
                'name': name,
                'disposition': workflow.token.document.disposition,
                'sight': actorData.prototypeToken.sight
            },
            'flags': {
                'chris-premades': {
                    'feature': {
                        'manifestEcho': {
                            'ownerUuid': workflow.actor.uuid
                        }
                    }
                }
            }
        },
        'token': {
            'name': name,
            'disposition': workflow.token.document.disposition,
            'sight': actorData.prototypeToken.sight
        }
    };
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar');
    let tokenImg = chris.getConfiguration(workflow.item, 'token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = chris.getConfiguration(workflow.item, 'animation') ?? 'default';
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await chris.spawn(sourceActor, updates, {}, workflow.token, 15, animation);
    let effect = workflow.actor.effects.find(i => i.flags['chris-premades']?.feature?.manifestEcho);
    if (effect) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Manifest Echo - Dismiss', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Manifest Echo - Dismiss');
    let featureData2 = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Manifest Echo - Teleport', false);
    if (!featureData2) return;
    featureData2.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Manifest Echo - Teleport');
    let featureData3 = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Manifest Echo - Attack', false);
    if (!featureData3) return;
    featureData3.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Manifest Echo - Attack');
    async function effectMacro () {
        await chrisPremades.macros.manifestEcho.dismiss({'workflow': {actor, token}});
    }
    async function effectMacro2() {
        await chrisPremades.macros.manifestEcho.turnEnd(token);
    }
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 604800
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                },
                'onTurnEnd': {
                    'script': chris.functionToString(effectMacro2)
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData3.name
                },
                'feature': {
                    'manifestEcho': true
                }
            }
        }
    };
    let updates2 = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData,
                [featureData2.name]: featureData2,
                [featureData3.name]: featureData3
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Manifest Echo',
        'description': 'Manifest Echo'
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
}
async function dismiss({speaker, actor, token, character, item, args, scope, workflow}) {
    let sceneEchos = canvas.scene.tokens.filter(i => i.actor?.flags?.['chris-premades']?.feature?.manifestEcho?.ownerUuid === workflow.actor.uuid);
    if (!sceneEchos.length) return;
    for (let i of sceneEchos) await warpgate.dismiss(i.id);
    await warpgate.revert(workflow.token.document, 'Manifest Echo');
}
async function teleport({speaker, actor, token, character, item, args, scope, workflow}) {
    let sceneEchos = canvas.scene.tokens.filter(i => i.actor?.flags?.['chris-premades']?.feature?.manifestEcho?.ownerUuid === workflow.actor.uuid);
    if (!sceneEchos.length) return;
    let targetToken;
    if (sceneEchos.length > 1) {
        let selection = await chris.selectTarget(workflow.item.name, constants.okCancel, sceneEchos, true, 'one', null, false, 'Which Echo?');
        if (!selection.buttons) return;
        let targetTokenUuid = selection.inputs.find(i => i);
        if (!targetTokenUuid) return;
        let targetToken = await fromUuid(targetTokenUuid);
        if (!targetToken) return;
    } else {
        targetToken = sceneEchos[0];
    }
    let updates = {
        'token': {
            'x': targetToken.x,
            'y': targetToken.y,
            'elevation': targetToken.elevation
        }
    }
    let updates2 = {
        'token': {
            'x': workflow.token.document.x,
            'y': workflow.token.document.y,
            'elevation': workflow.token.document.elevation
        }
    }
    let options = {
        'permanent': true,
        'name': 'Manifest Echo - Teleport',
        'description': 'Manifest Echo - Teleport',
        'updateOpts': {'token': {'animate': false}}
    };
    function animation(token) {
        new Sequence()
        .effect()
        .file('jb2a.misty_step.01.blue')
        .atLocation(token)
        .randomRotation()
        .scaleToObject(2)
        .play();
    }
    animation(targetToken.object);
    animation(workflow.token);
    await warpgate.wait(700);
    warpgate.mutate(workflow.token.document, updates, {}, options);
    warpgate.mutate(targetToken, updates2, {}, options);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    let sceneEchos = canvas.scene.tokens.filter(i => i.actor?.flags?.['chris-premades']?.feature?.manifestEcho?.ownerUuid === workflow.actor.uuid);
    if (!sceneEchos.length) return;
    let targetToken;
    if (sceneEchos.length > 1) {
        let selection = await chris.selectTarget(workflow.item.name, constants.okCancel, sceneEchos, true, 'one', null, false, 'Which Echo?');
        if (!selection.buttons) return;
        let targetTokenUuid = selection.inputs.find(i => i);
        if (!targetTokenUuid) return;
        let targetToken = await fromUuid(targetTokenUuid);
        if (!targetToken) return;
    } else {
        targetToken = sceneEchos[0];
    }
    let features = workflow.actor.items.filter(i => constants.weaponAttacks.includes(i.system.actionType) && (i.type === 'weapon' ? i.system.equipped : true));
    let feature;
    if (!features.length) {
        ui.notifications.info('You have no equipped weapons to attack with!');
        return;
    } else if (features.length > 1) {
        let selection = await chris.selectDocument(workflow.item.name, features);
        if (!selection) return;
        feature = selection[0];
    } else {
        feature = features[0];
    }
    let oldTargetPosition = {'x': duplicate(targetToken.x), 'y': duplicate(targetToken.y), 'elevation': duplicate(targetToken.elevation)};
    let oldTokenPosition = {'x': duplicate(workflow.token.document.x), 'y': duplicate(workflow.token.document.y), 'elevation': duplicate(workflow.token.document.elevation)};
    workflow.token.document.x = oldTargetPosition.x;
    workflow.token.document.y = oldTargetPosition.y;
    workflow.token.document.elevation = oldTargetPosition.elevation;
    targetToken.x = oldTokenPosition.x;
    targetToken.y = oldTokenPosition.y;
    targetToken.elevation = oldTokenPosition.elevation;
    let options = {
        'targetUuids': [workflow.targets.first().document.uuid]
    }
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, {}, options);
    workflow.token.document.x = oldTokenPosition.x;
    workflow.token.document.y = oldTokenPosition.y;
    workflow.token.document.elevation = oldTokenPosition.elevation;
    targetToken.x = oldTargetPosition.x;
    targetToken.y = oldTargetPosition.y;
    targetToken.elevation = oldTargetPosition.elevation;
}
async function turnEnd(token) {
    let sceneEchos = canvas.scene.tokens.filter(i => i.actor?.flags?.['chris-premades']?.feature?.manifestEcho?.ownerUuid === token.actor.uuid);
    if (!sceneEchos.length) return;
    let maxRange = chris.findEffect(token.actor, 'Echo Avatar') ? 1000 : 30;
    let echosLeft = sceneEchos.length;
    for (let i of sceneEchos) {
        let distance = chris.getDistance(token, i, false);
        if (distance > maxRange) {
            let selection = await chris.remoteDialog('Echo Knight', constants.yesNo, chris.lastGM(), token.actor.name + '\'s echo has moved far away. Remove it?');
            if (!selection) continue;
            await warpgate.dismiss(i.id);
            echosLeft -= 1;
        }
    }
    if (!echosLeft) await warpgate.revert(token.document, 'Manifest Echo');
}
export let manifestEcho = {
    'item': item,
    'dismiss': dismiss,
    'teleport': teleport,
    'attack': attack,
    'turnEnd': turnEnd
}