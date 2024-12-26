import {DialogApp} from '../applications/dialog.js';
import {CPRMultipleRollResolver} from '../applications/rollResolverMultiple.js';
import {genericUtils, itemUtils, workflowUtils} from '../utils.js';
import {Summons} from './summons.js';
import {Teleport} from './teleport.js';
async function createEffect(entityUuid, effectData, {concentrationItemUuid, parentEntityUuid}) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    let effects = await entity.createEmbeddedDocuments('ActiveEffect', [effectData]);
    if (concentrationItemUuid) {
        let concentrationItem = await fromUuid(concentrationItemUuid);
        if (concentrationItem) {
            let concentrationEffect = MidiQOL.getConcentrationEffect(concentrationItem.actor, concentrationItem);
            if (concentrationEffect) concentrationEffect.addDependent(...effects);
        }
    }
    if (parentEntityUuid) {
        let parentEntity = await fromUuid(parentEntityUuid);
        if (parentEntity) {
            parentEntity.addDependent(...effects);
        }
    }
    if (effects?.length) return effects[0].uuid;
}
async function createEffects(entityUuid, effectDataArray, {concentrationItemUuidArray, parentEntityUuidArray}) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    let effects = await entity.createEmbeddedDocuments('ActiveEffect', effectDataArray);
    for (let i = 0; i < effects.length; i++) {
        if (concentrationItemUuidArray[i]) {
            let concentrationItem = await fromUuid(concentrationItemUuidArray[i]);
            if (concentrationItem) {
                let concentrationEffect = MidiQOL.getConcentrationEffect(concentrationItem.actor, concentrationItem);
                if (concentrationEffect) concentrationEffect.addDependent(effects[i]);
            }
        }
        if (parentEntityUuidArray[i]) {
            let parentEntity = await fromUuid(parentEntityUuidArray[i]);
            if (parentEntity) {
                parentEntity.addDependent(effects[i]);
            }
        }
    }
    if (effects?.length) return effects.map(i => i.uuid);
}
async function deleteEntity(entityUuid) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    await entity.delete();
}
async function updateEntity(entityUuid, updates, options) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    await entity.update(updates, options);
}
async function setFlag(entityUuid, scope, key, value) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    await entity.setFlag(scope, key, value);
}
async function createFolder(folderData) {
    let folder = await Folder.create(folderData);
    return folder.uuid;
}
async function createActor(actorData) {
    let actor = await Actor.create(actorData);
    return actor.uuid;
}
async function addDependent(entityUuid, dependentUuids) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    let dependents = await Promise.all(dependentUuids.map(async i => {
        return await fromUuid(i);
    }).filter(j => j));
    await entity.addDependent(...dependents);
}
async function createEmbeddedDocuments(entityUuid, type, updates, options) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    let documents = await entity.createEmbeddedDocuments(type, updates, options ?? undefined);
    return documents.map(i => i.uuid);
}
async function updateEmbeddedDocuments(entityUuid, type, updates, options) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    let documents = await entity.updateEmbeddedDocuments(type, updates, options ?? undefined);
    return documents.map(i => i.uuid);
}
async function deleteEmbeddedDocuments(entityUuid, type, ids, options) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    let documents = await entity.deleteEmbeddedDocuments(type, ids, options ?? undefined);
    return documents.map(i => i.uuid);
}
async function updateTargets(targetIds, userId) {
    let user = game.users.get(userId);
    if (!user) return;
    user.updateTokenTargets(targetIds);
    user.broadcastActivity({targets: user.targets.ids});
}
async function addFavorites(actorUuid, entityUuids, type='item') {
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    if (!actor.system.addFavorite) return;
    let entities = await Promise.all(entityUuids.map(async i => {
        return await fromUuid(i);
    }).filter(j => j));
    if (type === 'item') {
        for (let i of entities) await actor.system.addFavorite({
            id: i.getRelativeUUID(i.actor),
            type: 'item'
        });
    } else if (type === 'activity') {
        for (let i of entities) await actor.system.addFavorite({
            id: i.relativeUUID,
            type: 'activity'
        });
    }
}
async function removeFavorites(actorUuid, entityUuids, type='item') {
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    if (!actor.system.removeFavorite) return;
    let entities = await Promise.all(entityUuids.map(async i => {
        return await fromUuid(i);
    }).filter(j => j));
    if (type === 'item') {
        for (let i of entities) await actor.system.removeFavorite(i.getRelativeUUID(i.actor));
    } else if (type === 'activity') {
        for (let i of entities) await actor.system.removeFavorite(i.relativeUUID);
    }
}
async function dialog(...options) {
    let message = await ChatMessage.create({
        speaker: {alias: game.user.name},
        content: '<hr>' + genericUtils.translate('CHRISPREMADES.Dialog.RemoteMessage') + ' ' + game.user.name + '.',
    });
    let selection = await DialogApp.dialog(...options);
    await genericUtils.remove(message);
    return selection;
}
async function rollItem(itemRef, config, options) {
    let item = await fromUuid(itemRef);
    if (!item) return;
    return await MidiQOL.completeItemUse(item, config, options);
}
async function createSidebarActor(actorUuid, {folderId} = {}) {
    let compendiumActor = await fromUuid(actorUuid);
    if (!compendiumActor) return;
    let actorData = compendiumActor.toObject();
    genericUtils.setProperty(actorData, 'flags.core.sourceId', compendiumActor.uuid);
    if (folderId) genericUtils.setProperty(actorData, 'folder', folderId);
    let actor = await Actor.create(actorData);
    return actor.uuid;
}
async function teleport(tokenUuids, controllingTokenUuid, options={}) {
    let tokens = await Promise.all(tokenUuids.map(async i => {
        return (await fromUuid(i))?.object;
    }).filter(j => j));
    let controllingToken = (await fromUuid(controllingTokenUuid))?.object;
    if (!controllingToken) return;
    if (tokens.length > 1) {
        await Teleport.group(tokens, controllingToken, options);
    } else {
        await Teleport.target(tokens, controllingToken, options);
    }
}
async function spawnSummon(actorUuid, updates, sceneUuid) {
    return Summons.socketSpawn(actorUuid, updates, sceneUuid);
}
async function setReactionUsed(actorUuid) {
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    return MidiQOL.setReactionUsed(actor);
}
async function removeReactionUsed(actorUuid, force) {
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    return MidiQOL.removeReactionUsed(actor, force);
}
async function setBonusActionUsed(actorUuid) {
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    return MidiQOL.setBonusActionUsed(actor);
}
async function removeBonusActionUsed(actorUuid, force) {
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    return MidiQOL.removeBonusActionUsed(actor, force);
}
async function polymorph(origActorUuid, newActorUuid, options, renderSheet=true) {
    let origActor = await fromUuid(origActorUuid);
    let newActor = await fromUuid(newActorUuid);
    if (!origActor || !newActor) return;
    let tokens = await origActor.transformInto(newActor, options, {renderSheet});
    return tokens.map(i => i.uuid);
}
async function remoteRoll(rollJSON) {
    let roll = await Roll.fromData(rollJSON).evaluate();
    return roll.toJSON();
}
async function remoteDamageRolls(rollJSONs) {
    let rolls = rollJSONs.map(i => CONFIG.Dice.DamageRoll.fromData(i));
    let resolver = new CPRMultipleRollResolver(rolls);
    await resolver.awaitFulfillment();
    rolls.forEach(async roll => {
        const ast = CONFIG.Dice.parser.toAST(roll.terms);
        roll._total = await roll._evaluateASTAsync(ast);
    });
    resolver.close();
    return rolls.map(i => i.toJSON());
}
async function syntheticItemDataRoll(itemData, actorUuid, targetUuids, {options = {}, config = {}} = {}) {
    let actor = fromUuidSync(actorUuid);
    let targets = targetUuids.map(i => fromUuidSync(i)?.object);
    let item = await itemUtils.syntheticItem(itemData, actor);
    let workflow = await workflowUtils.syntheticItemRoll(item, targets, {options, config});
    return workflow.getMacroData({noWorkflowReference: true});
}
export let sockets = {
    createEffect,
    createEffects,
    deleteEntity,
    updateEntity,
    createFolder,
    createActor,
    addDependent,
    createEmbeddedDocuments,
    addFavorites,
    removeFavorites,
    setFlag,
    dialog,
    rollItem,
    createSidebarActor,
    updateEmbeddedDocuments,
    deleteEmbeddedDocuments,
    updateTargets,
    teleport,
    spawnSummon,
    setReactionUsed,
    removeReactionUsed,
    setBonusActionUsed,
    removeBonusActionUsed,
    polymorph,
    remoteRoll,
    remoteDamageRolls,
    syntheticItemDataRoll
};
export let socket;
export function registerSockets() {
    socket = socketlib.registerModule('chris-premades');
    Object.keys(sockets).forEach(i => {
        socket.register(i, sockets[i]);
    });
}