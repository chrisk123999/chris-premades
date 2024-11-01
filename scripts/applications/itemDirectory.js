function itemContext(app, options) {
    options.push({
        name: 'CHRISPREMADES.ItemDirectory.ExportForSharing',
        icon: '<i class="fas fa-file-export"></i>',
        condition: true,
        callback: async header => {
            let documentId = header[0].dataset.documentId;
            let item = game.items.get(documentId);
            if (!item) return;
            exportItemToJSON(item);
        }
    });
}
function exportItemToJSON(document) {
    let data = document.toCompendium(null);
    data.flags.exportSource = {
        world: game.world.id,
        system: game.system.id,
        coreVersion: game.version,
        systemVersion: game.system.version
    };
    data.effects.forEach(effect => effect.description = '');
    data.system.description = {chat: '', value: ''};
    if (data.system.unidentified) data.system.unidentified.description = '';
    let filename = ['fvtt', document.documentName, document.name?.slugify(), document.id].filterJoin('-');
    // eslint-disable-next-line no-undef
    saveDataToFile(JSON.stringify(data, null, 2), 'text/json', filename + '.json');
}
function actorContext(app, options) {
    options.push({
        name: 'CHRISPREMADES.ItemDirectory.ExportForSharing',
        icon: '<i class="fas fa-file-export"></i>',
        condition: true,
        callback: async header => {
            let documentId = header[0].dataset.documentId;
            let actor = game.actors.get(documentId);
            if (!actor) return;
            exportActorToJSON(actor);
        }
    });
}
function exportActorToJSON(document) {
    let data = document.toCompendium(null);
    data.flags.exportSource = {
        world: game.world.id,
        system: game.system.id,
        coreVersion: game.version,
        systemVersion: game.system.version
    };
    data.effects.forEach(effect => effect.description = '');
    data.items.forEach(item => {
        item.effects.forEach(effect => effect.description = '');
        item.system.description = {chat: '', value: ''};
        if (item.system.unidentified) item.system.unidentified.description = '';
    });
    data.system.details.biography = {public: '', value: ''};
    let filename = ['fvtt', document.documentName, document.name?.slugify(), document.id].filterJoin('-');
    // eslint-disable-next-line no-undef
    saveDataToFile(JSON.stringify(data, null, 2), 'text/json', filename + '.json');
}
export let itemDirectory = {
    itemContext,
    actorContext
};