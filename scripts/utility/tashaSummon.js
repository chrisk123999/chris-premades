import {chris} from '../helperFunctions.js';
import {socket} from '../module.js';
async function setupFolder() {
    let folder = game.folders.getName('Chris Premades');
    if (!folder) {
        folder = await Folder.create({
            'name': 'Chris Premades',
            'type': 'Actor',
            'color': '#348f2d'
        });
    }
    let summonsCompendium = game.packs.get('chris-premades.CPR Summons');
    if (!summonsCompendium) return;
    let documents = await summonsCompendium.getDocuments();
    if (documents.length === 0) return;
    for (let actor of documents) {
        let folderActor = folder.contents.find(act => act.name === actor.name);
        let avatarImg;
        let tokenImg;
        if (folderActor) {
            let folderVersion = folderActor.flags['chris-premades']?.version;
            let documentVersion = actor.flags['chris-premades']?.version;
            if (folderVersion && folderVersion === documentVersion) continue;
            avatarImg = folderActor.img;
            tokenImg = folderActor.prototypeToken.texture.src;
            await folderActor.delete();
        }
        let actorData = actor.toObject();
        actorData.folder = folder.id;
        if (avatarImg) actorData.img = avatarImg;
        if (tokenImg) actorData.prototypeToken.texture.src = tokenImg;
        await Actor.create(actorData);
    }
}
function getCR(prof) {
    switch (prof) {
        case 2:
            return 0;
        case 3:
            return 5;
        case 4:
            return 9;
        case 5:
            return 13;
        case 6:
            return 17;
        case 7:
            return 21;
        case 8:
            return 25;
        case 9:
            return 29;
    }
}
async function spawn(sourceActor, updates, duration, originItem) {
    async function effectMacro() {
        let originActor = origin.actor;
        await warpgate.dismiss(token.id);
        let castEffect = chrisPremades.helpers.findEffect(originActor, origin.name);
        if (castEffect) await chrisPremades.helpers.removeEffect(castEffect);
    }
    let effectData = {
        'label': 'Summoned Creature',
        'icon': originItem.img,
        'duration': {
            'seconds': duration
        },
        'origin': originItem.uuid,
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
    }
    if (!updates) updates = {};
    setProperty(updates, 'embedded.ActiveEffect.Summoned Creature', effectData);
    let options = {
        'controllingActor': originItem.actor
    }
    let tokenDocument = await sourceActor.getTokenDocument();
    let spawnedTokens = await warpgate.spawn(tokenDocument, updates, {}, options);
    if (!spawnedTokens) return;
    let spawnedToken = game.canvas.scene.tokens.get(spawnedTokens[0]);
    if (!spawnedToken) return;
    let targetEffect = chris.findEffect(spawnedToken.actor, 'Summoned Creature');
    if (!targetEffect) return;
    let casterEffectData = {
        'label': originItem.name,
        'icon': originItem.img,
        'duration': {
            'seconds': duration
        },
        'origin': originItem.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': 'let effect = await fromUuid("' + targetEffect.uuid + '"); if (!effect) return; await chrisPremades.helpers.removeEffect(effect);'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': 'Dismiss Summon'
                }
            }
        }
    }
    await chris.createEffect(originItem.actor, casterEffectData);
    if (!chris.inCombat()) return;
    let casterCombatant = game.combat.combatants.contents.find(combatant => combatant.actorId === originItem.actor.id);
    if (!casterCombatant) return;
    let initiative = casterCombatant.initiative - 0.01;
    await socket.executeAsGM('createCombatant', spawnedToken.id, spawnedToken.actor.id, canvas.scene.id, initiative);
}
async function createCombatant (tokenId, actorId, sceneId, initiative) {
    await game.combat.createEmbeddedDocuments('Combatant', [{
        'tokenId': tokenId,
        'sceneId': sceneId,
        'actorId': actorId,
        'hidden': false,
        'initiative': initiative
    }]);
}
export let tashaSummon = {
    'setupFolder': setupFolder,
    'getCR': getCR,
    'spawn': spawn,
    'createCombatant': createCombatant
};