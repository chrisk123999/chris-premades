import {chris} from '../helperFunctions.js';
import {socket} from '../module.js';
import {queue} from '../queue.js';
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
        let imageFlags;
        if (folderActor) {
            let folderVersion = folderActor.flags['chris-premades']?.version;
            let documentVersion = actor.flags['chris-premades']?.version;
            if (folderVersion && folderVersion === documentVersion) continue;
            avatarImg = folderActor.img;
            tokenImg = folderActor.prototypeToken.texture.src;
            imageFlags = folderActor.flags['chris-premades']?.summon;
            await folderActor.delete();
        }
        let actorData = actor.toObject();
        actorData.folder = folder.id;
        if (avatarImg) actorData.img = avatarImg;
        if (tokenImg) actorData.prototypeToken.texture.src = tokenImg;
        if (imageFlags) actorData.flags['chris-premades'].summon = imageFlags;
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
    };
    if (!updates) updates = {};
    setProperty(updates, 'embedded.ActiveEffect.Summoned Creature', effectData);
    let options = {
        'controllingActor': originItem.actor
    };
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
                    'script': 'let effect = await fromUuid("' + targetEffect.uuid + '"); if (effect) await chrisPremades.helpers.removeEffect(effect);'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': 'Dismiss Summon'
                }
            }
        }
    };
    await chris.createEffect(originItem.actor, casterEffectData);
    if (chris.inCombat()) {
        let casterCombatant = game.combat.combatants.contents.find(combatant => combatant.actorId === originItem.actor.id);
        if (casterCombatant) {
            let initiative = casterCombatant.initiative - 0.01;
            await socket.executeAsGM('createCombatant', spawnedToken.id, spawnedToken.actor.id, canvas.scene.id, initiative);
        }
    }
    return spawnedToken;
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
async function meleeAttack({speaker, actor, token, character, item, args, scope, workflow}) {
    let attackBonus = workflow.actor.flags['chris-premades']?.summon?.attackBonus?.melee;
    if (!attackBonus) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'tashaMeleeAttack', 50);
    if (!queueSetup) return;
    let attackRoll = await chris.addToRoll(workflow.attackRoll, attackBonus);
    await workflow.setAttackRoll(attackRoll);
    queue.remove(workflow.item.uuid);
}
async function rangedAttack({speaker, actor, token, character, item, args, scope, workflow}) {
    let attackBonus = workflow.actor.flags['chris-premades']?.summon?.attackBonus?.ranged;
    if (!attackBonus) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'tashaRangedAttack', 50);
    if (!queueSetup) return;
    let attackRoll = await chris.addToRoll(workflow.attackRoll, attackBonus);
    await workflow.setAttackRoll(attackRoll);
    queue.remove(workflow.item.uuid);
}
export let tashaSummon = {
    'setupFolder': setupFolder,
    'getCR': getCR,
    'spawn': spawn,
    'createCombatant': createCombatant,
    'meleeAttack': meleeAttack,
    'rangedAttack': rangedAttack
};