export async function backupCharacters() {
    let key = game.settings.get('chris-premades', 'Backup Compendium');
    let pack = game.packs.get(key);
    if (!pack) {
        ui.notifications.warn('Invalid backup compendium specified! No backups have been made!');
        return;
    }
    let currentTime = Date.now();
    let lastBackupTime = game.settings.get('chris-premades', 'Last Backup');
    let frequency = game.settings.get('chris-premades', 'Backup Frequency');
    let characters = game.actors.filter(i => i.type === 'character' && i.hasPlayerOwner === true);
    if (characters.length) {
        if (lastBackupTime + frequency <= currentTime) {
            let folderName = new Date(currentTime).toDateInputString();
            let folder = pack.folders.getName(i => i.name = folderName);
            if (!folder) {
                folder = await Folder.create({
                    'name': folderName,
                    'type': 'Actor'
                }, {'pack': key});
            }
            let actorDatas = await Promise.all(characters.map(async i => {
                let actorData = i.toObject();
                delete actorData._id;
                setProperty(actorData, 'flags.chris-premades.backup.time', currentTime);
                setProperty(actorData, 'folder', folder.id);
                return actorData;
            }));
            await Actor.createDocuments(actorDatas, {'pack': key});
            game.settings.set('chris-premades', 'Last Backup', currentTime);
            await ChatMessage.create({
                'speaker': {'alias': 'Chris\'s Premades'},
                'whisper': [game.user.id],
                'content': '<hr><b>Automatic Backup Created:</b><br><hr>- ' + characters.map(i => i.name).join('<br>- ')
            });
        }
    }
    let retention = game.settings.get('chris-premades', 'Backup Retention Period');
    if (!retention) return;
    let index = await pack.getIndex({'fields': ['flags.chris-premades.backup.time']});
    let removeActors = index.filter(i => {
        let time = i.flags?.['chris-premades']?.backup?.time;
        if (!time) return false;
        if (time + retention <= currentTime) return true;
    });
    if (!removeActors.length) return;
    await Actor.deleteDocuments(removeActors.map(j => j._id), {'pack': key});
    await ChatMessage.create({
        'speaker': {'alias': 'Chris\'s Premades'},
        'whisper': [game.user.id],
        'content': '<hr><b>Expired Backup Deleted:</b><br><hr>- ' + removeActors.map(i => i.name).join('<br>- ')
    });
}
export function createActor(actor, updates, options, userId) {
    let key = game.settings.get('chris-premades', 'Backup Compendium');
    if (actor.pack != key || actor.flags['chris-premades']?.backup?.time) return;
    actor.updateSource({'flags.chris-premades.backup.time': Date.now()});
    console.log('here');
}