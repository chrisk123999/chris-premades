import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Dancing Sword');
    if (!sourceActor) return;
    let effect = chris.findEffect(workflow.actor, 'Dancing Sword Passive');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
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
    let name = chris.getConfiguration(workflow.item, 'name') ?? originItem.name;
    if (name === '') name = originItem.name;
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
    
    let avatarImg = chris.getConfiguration(originItem, 'avatar');
    if (avatarImg) updates.actor.img = avatarImg;
    let tokenImg = chris.getConfiguration(originItem, 'token');
    if (!tokenImg) {
        let weaponType = originItem.system.baseItem;
        if (chris.jb2aCheck() && weaponType) {
            try {
                tokenImg = await Sequencer.Database.getEntry('jb2a.spiritual_weapon.' + weaponType + '.01.spectral.02.green').file;
            } catch {}
            if (!tokenImg) {await Sequencer.Database.getEntry('jb2a.spiritual_weapon.greatsword.01.spectral.02.green').file}
        }
    }
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
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
                'key': 'flags.chris-premades.feature.dancingSword.tokenUuid',
                'mode': 5,
                'value': spawnedToken.uuid,
                'priority': 20
            }
        ],
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': 'let effect = await fromUuid("' + targetEffect.uuid + '"); if (effect) await chrisPremades.helpers.removeEffect(effect); await warpgate.revert(token.document, "Dancing Sword");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': 'Dancing Sword - Attack'
                }
            }
        }
    };
    let attackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Dancing Sword - Attack', false);
    if (!attackFeatureData) return;
    attackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dancing Sword - Attack');
    attackFeatureData.system.ability = originItem.system.ability;
    if (originItem.system.properties.fin === true && workflow.actor.system.abilities.dex.mod > workflow.actor.system.abilities.str.mod) attackFeatureData.system.ability = 'dex';
    attackFeatureData.system.damage.parts = originItem.system.damage.parts;
    attackFeatureData.img = originItem.img;
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
        'name': 'Dancing Sword',
        'description': 'Dancing Sword'
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options2);
}
async function attackEarly({speaker, actor, token, character, item, args, scope, workflow}) {
    let uses = workflow.item?.flags['chris-premades']?.feature?.dancingSword?.uses ?? 0;
    uses += 1;
    await workflow.item.setFlag('chris-premades', 'feature.dancingSword.uses', uses);
    await workflow.item.setFlag('chris-premades', 'feature.dancingSword.position', {'x': workflow.token.document.x, 'y': workflow.token.document.y});
    await workflow.actor.setFlag('chris-premades', 'mechanic.noFlanking', true);
    let weaponTokenUuid = workflow.actor.flags['chris-premades']?.feature?.dancingSword?.tokenUuid;
    if (!weaponTokenUuid) return;
    let weaponToken = await fromUuid(weaponTokenUuid);
    if (!weaponToken) return;
    let position = canvas.grid.getSnappedPosition(weaponToken.x, weaponToken.y);
    workflow.token.document.x = position.x;
    workflow.token.document.y = position.y;
    workflow.flankingAdvantage = false; //Does not currently work.
}
async function attackLate({speaker, actor, token, character, item, args, scope, workflow}) { 
    await workflow.actor.unsetFlag('chris-premades', 'mechanic.noFlanking');
    let position = workflow.item.flags['chris-premades']?.feature?.dancingSword?.position;
    if (!position) return;
    workflow.token.document.x = position.x;
    workflow.token.document.y = position.y;
    if (workflow.item?.flags['chris-premades']?.feature?.dancingSword?.uses === 4) {
        let effect = chris.findEffect(workflow.actor, 'Dancing Sword - Toss');
        if (!effect) return;
        await chris.removeEffect(effect);
    }
}
async function equip(actor, origin, level) {
    let itemData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Dancing Sword - Toss', false);
    if (!itemData) return;
    itemData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dancing Sword - Toss');
    itemData.img = (origin).img;
    await chris.addTempItem(actor, itemData, origin.id, 'Dancing Sword - Toss', false, 0);
}
async function unequip(actor, origin) {
    await chris.removeTempItems(actor, origin.id);
}
async function deleted(actor, effect) {
    if (effect.disabled) return;
    let originArray = effect.origin.split('Item.');
    if (originArray.length != 2) return;
    let originID = originArray[1];
    await chris.removeTempItems(actor, originID);
}
export let dancingSword = {
    'item': item,
    'attackEarly': attackEarly,
    'attackLate': attackLate,
    'equip': equip,
    'unequip': unequip,
    'deleted': deleted
}