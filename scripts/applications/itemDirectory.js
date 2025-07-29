function itemContext(app, options) {
    options.push({
        name: 'CHRISPREMADES.ItemDirectory.ExportForSharing',
        icon: '<i class="fas fa-file-export"></i>',
        condition: true,
        callback: async li => {
            let entryId = li.dataset.entryId;
            let item = game.items.get(entryId);
            if (!item) return;
            exportItemToJSON(item);
        }
    });
}
function exportItemToJSON(document) {
    let data = document.toCompendium(null);
    foundry.utils.setProperty(data, '_statse.exportSource', {
        world: game.world.id,
        system: game.system.id,
        coreVersion: game.version,
        systemVersion: game.system.version
    });
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
        callback: async li => {
            let entryId = li.dataset.entryId;
            let actor = game.actors.get(entryId);
            if (!actor) return;
            exportActorToJSON(actor);
        }
    });
}
function exportActorToJSON(document) {
    let data = document.toCompendium(null);
    foundry.utils.setProperty(data, '_stats.exportSource', {
        world: game.world.id,
        system: game.system.id,
        coreVersion: game.version,
        systemVersion: game.system.version
    });
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