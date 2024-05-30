async function createEffect(entityUuid, effectData, {concentrationItemUuid, parentEntityUuid}) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    let effects = await entity.createEmbeddedDocuments('ActiveEffect', [effectData]);
    if (concentrationItemUuid) {
        let concentrationItem = await fromUuid(concentrationItemUuid);
        if (concentrationItem) {
            let concentrationEffect = MidiQOL.getConcentrationEffect(concentrationItem.actor, concentrationItem);
            if (concentrationEffect) concentrationEffect.addDependents(...effects);
        }
    }
    if (parentEntityUuid) {
        let parentEntity = await fromUuid(parentEntityUuid);
        if (parentEntity) {
            parentEntity.addDependents(...effects);
        }
    }
    if (effects?.length) return effects[0].uuid;
}
async function deleteEntity(entityUuid) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    await entity.delete();
}
async function updateEntity(entityUuid, updates) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    await entity.update(updates);
}
async function createFolder(folderData) {
    let folder = await Folder.create(folderData);
    return folder.uuid;
}
async function createActor(actorData) {
    let actor = await Actor.create(actorData);
    return actor.uuid;
}
async function addDependents(entityUuid, dependentUuids) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    let dependents = await Promise.all(dependentUuids.map(async i => {
        return await fromUuid(i);
    }).filter(j => j));
    entity.addDependents(...dependents);
}
async function createEmbeddedDocuments(entityUuid, type, updates) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    let documents = await entity.createEmbeddedDocuments(type, updates);
    return documents.map(i => document.uuid);
}
async function addFavorites(actorUuid, itemUuids) {
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    let items = await Promise.all(itemUuids.map(async i => {
        return await fromUuid(i);
    }).filter(j => j));
    for (let i of items) await actor.system.addFavorite(i);
}
let sockets = [
    createEffect,
    deleteEntity,
    updateEntity,
    createFolder,
    createActor,
    addDependents,
    createEmbeddedDocuments,
    addFavorites
];
export let socket;
export function registerSockets() {
    Hooks.once('socketlib.ready', () => {
        socket = socketlib.registerModule('chris-premades');
        sockets.forEach(i => {
            socket.register(i.name, i);
        });
    });
}