import {chris} from '../../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Spectral Tentacle');
    if (!sourceActor) return;
    async function effectMacro() {
        let originActor = origin.actor;
        await warpgate.dismiss(token.id);
        let castEffect = chrisPremades.helpers.findEffect(originActor, origin.name);
        if (castEffect) await chrisPremades.helpers.removeEffect(castEffect);
    }
    let effectData = {
        'label': workflow.item.name,
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
                'vae': {
                    'button': 'Dismiss Summon'
                }
            }
        }
    };
    let name = 'Spectral Tentacle';
    let updates = {
        'actor': {
            'name': name,
            'prototypeToken': {
                'name': name
            }
        },
        'token': {
            'name': name
        },
        'embedded': {
            'ActiveEffect': {
                [effectData.label]: effectData
            }
        }
    };
    let options = {
        'controllingActor': workflow.token.actor
    };
    let tokenDocument = await sourceActor.getTokenDocument();
    let spawnedTokens = await warpgate.spawn(tokenDocument, updates, {}, options);
    if (!spawnedTokens) return;
    let spawnedToken = game.canvas.scene.tokens.get(spawnedTokens[0]);
    if (!spawnedToken) return;
    let targetEffect = chris.findEffect(spawnedToken.actor, workflow.item.name);
    if (!targetEffect) return;
    let casterEffectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'changes': [
            {
                'key': 'flags.chris-premades.feature.tentacleOfTheDeeps.tokenUuid',
                'mode': 5,
                'value': spawnedToken.uuid,
                'priority': 20
            }
        ],
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': 'let effect = await fromUuid("' + targetEffect.uuid + '"); if (effect) await chrisPremades.helpers.removeEffect(effect); await warpgate.revert(token.document, "Tentacle of the Deeps");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': 'Tentacle of the Deeps - Attack'
                }
            }
        }
    };
    let attackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Tentacle of the Deeps - Attack', false);
    if (!attackFeatureData) return;
    attackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Tentacle of the Deeps - Attack');
    attackFeatureData.system.ability = chris.getSpellMod(workflow.item);
    let updates2 = {
        'embedded': {
            'Item': {
                [attackFeatureData.name]: attackFeatureData
            },
            'ActiveEffect': {
                [casterEffectData.label]: casterEffectData
            }
        }
    };
    let options2 = {
        'permanent': false,
        'name': 'Tentacle of the Deeps',
        'description': 'Tentacle of the Deeps'
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options2);
}
async function attackEarly({speaker, actor, token, character, item, args, scope, workflow}) {
    await workflow.item.setFlag('chris-premades', 'feature.tentacleOfTheDeeps.position', {'x': workflow.token.document.x, 'y': workflow.token.document.y});
    await workflow.actor.setFlag('chris-premades', 'mechanic.noFlanking', true);
    let tentacleTokenUuid = workflow.actor.flags['chris-premades']?.feature?.tentacleOfTheDeeps?.tokenUuid;
    if (!tentacleTokenUuid) return;
    let tentacleToken = await fromUuid(tentacleTokenUuid);
    if (!tentacleToken) return;
    let position = canvas.grid.getSnappedPosition(tentacleToken.x, tentacleToken.y);
    workflow.token.document.x = position.x;
    workflow.token.document.y = position.y;
    workflow.flankingAdvantage = false; //Does not currently work.
}
async function attackLate({speaker, actor, token, character, item, args, scope, workflow}) { 
    await workflow.actor.unsetFlag('chris-premades', 'mechanic.noFlanking');
    let position = workflow.item.flags['chris-premades']?.feature?.tentacleOfTheDeeps?.position;
    if (!position) return;
    workflow.token.document.x = position.x;
    workflow.token.document.y = position.y;
}
export let tentacleOfTheDeeps = {
    'item': item,
    'attackEarly': attackEarly,
    'attackLate': attackLate
}