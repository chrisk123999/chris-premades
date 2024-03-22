async function update(actors) {
    for (let actor of actors) {
        console.log('Updating: ' + actor.name);
        try {
            await game.modules.get('ddb-importer')?.api.effects.addDDBIEffectsToActorDocuments(actor, {'useChrisPremades': true });
        } catch (error) {
            console.log('Error when updating ' + actor.name);
            console.error(error);
        }
    }
}
export async function updateSidebarNPCs() {
    if (!game.modules.get('ddb-importer')?.active) {
        ui.notifications.info('This feature requires the D&D Beyond Importer module to be active!');
        return;
    }
    ui.notifications.info('Starting sidebar NPC updater!');
    let actors = game.actors.filter(e => e && e.type !== 'character');
    if (actors.length != 0) await update(actors);
    ui.notifications.info('Sidebar NPC updater complete!');
}
export async function updateSceneNPCs() {
    if (!game.modules.get('ddb-importer')?.active) {
        ui.notifications.info('This feature requires the D&D Beyond Importer module to be active!');
        return;
    }
    ui.notifications.info('Starting scene NPC updater!');
    if (canvas.scene) {
        let actors = canvas.scene.tokens.map(i => i.actor).filter(e => e && e.type !== 'character');
        if (actors.length != 0) await update(actors);
    }
    ui.notifications.info('Scene NPC updater complete!');
}
export async function updateAllSceneNPCs() {
    if (!game.modules.get('ddb-importer')?.active) {
        ui.notifications.info('This feature requires the D&D Beyond Importer module to be active!');
        return;
    }
    ui.notifications.info('Starting all scenes NPC updater!');
    for (let scene of game.scenes) {
        let actors = scene.tokens.map(i => i.actor).filter(e => e && e.type !== 'character');
        if (actors.length != 0) await update(actors);
    }
    ui.notifications.info('All scenes NPC updater complete!');
}