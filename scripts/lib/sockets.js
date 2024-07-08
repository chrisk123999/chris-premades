import {DialogApp} from '../applications/dialog.js';
import {genericUtils} from '../utils.js';
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
    let documents = await entity.createEmbeddedDocuments(type, updates, options);
    return documents.map(i => i.uuid);
}
async function updateEmbeddedDocuments(entityUuid, type, updates, options) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    let documents = await entity.updateEmbeddedDocuments(type, updates, options);
    return documents.map(i => i.uuid);
}
async function addFavorites(actorUuid, itemUuids) {
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    let items = await Promise.all(itemUuids.map(async i => {
        return await fromUuid(i);
    }).filter(j => j));
    for (let i of items) await actor.system.addFavorite({
        id: i.getRelativeUUID(i.actor),
        type: 'item'
    });
}
async function dialog(...options) {
    return await DialogApp.dialog(...options);
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
let sockets = [
    createEffect,
    deleteEntity,
    updateEntity,
    createFolder,
    createActor,
    addDependent,
    createEmbeddedDocuments,
    addFavorites,
    setFlag,
    dialog,
    rollItem,
    createSidebarActor,
    updateEmbeddedDocuments
];
export let socket;
export function registerSockets() {
    socket = socketlib.registerModule('chris-premades');
    sockets.forEach(i => {
        socket.register(i.name, i);
    });
}