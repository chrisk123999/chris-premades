import {DialogApp} from '../applications/dialog.js';
import {genericUtils} from '../utils.js';
async function selectCompendium() {
    let oldCompendiumKey = genericUtils.getCPRSetting('backupCompendium');
    let compendiums = game.packs.filter(i => i.metadata.type === 'Actor');
    let inputs = compendiums.map(i => ({
        label: i.metadata.label,
        name: i.metadata.id,
        options: {isChecked: oldCompendiumKey === i.metadata.id}
    }));
    let selection = await DialogApp.dialog('CHRISPREMADES.Settings.backupCompendium.Name', 'CHRISPREMADES.Settings.backupCompendium.Hint', [['radio', inputs, {displayAsRows: true}]], 'okCancel', {id: 'cpr-backup-compendium'});
    if (!selection) return;
    await game.settings.set('chris-premades', 'backupCompendium', selection.radio);
}
async function doBackup(force) {
    let key = genericUtils.getCPRSetting('backupCompendium');
    let pack = game.packs.get(key);
    if (!pack) {
        genericUtils.notify('CHRISPREMADES.Backup.MissingPack', 'warn', {localize: true});
        return;
    }
    let currentTime = Date.now();
    let lastBackupTime = Number(genericUtils.getCPRSetting('backupTime'));
    let frequency = Number(genericUtils.getCPRSetting('backupFrequency'));
    let characters = game.actors.filter(i => i.type === 'character' && i.hasPlayerOwner === true);
    if (characters.length) {
        if ((lastBackupTime + frequency <= currentTime) || force) {
            let folderName = new Date(currentTime).toDateInputString();
            let folder = pack.folders.getName(folderName);
            if (!folder) {
                folder = await Folder.create({
                    name: folderName,
                    type: 'Actor'
                }, {pack: key});
            }
            let actorDatas = await Promise.all(characters.map(async i => {
                let actorData = i.toObject();
                delete actorData._id;
                genericUtils.setProperty(actorData, 'flags.chris-premades.backup.time', currentTime);
                genericUtils.setProperty(actorData, 'folder', folder.id);
                return actorData;
            }));
            await Actor.createDocuments(actorDatas, {pack: key});
            game.settings.set('chris-premades', 'backupTime', currentTime);
            await ChatMessage.create({
                speaker: {alias: 'Cauldron of Plentiful Resources'},
                whisper: [game.user.id],
                content: '<hr><b>Automatic Backup Created:</b><br><hr>- ' + characters.map(i => i.name).join('<br>- ')
            });
        }
    }
    let retention = Number(genericUtils.getCPRSetting('backupRetention'));
    if (!retention || force) return;
    let index = await pack.getIndex({fields: ['flags.chris-premades.backup.time']});
    let removeActors = index.filter(i => {
        let time = i.flags?.['chris-premades']?.backup?.time;
        if (!time) return false;
        if (time + retention <= currentTime) return true;
        return false;
    });
    if (removeActors.length) {
        await Actor.deleteDocuments(removeActors.map(j => j._id), {pack: key});
        await ChatMessage.create({
            speaker: {alias: 'Cauldron of Plentiful Resources'},
            whisper: [game.user.id],
            content: '<hr><b>Expired Backup Deleted:</b><br><hr>- ' + removeActors.map(i => i.name).join('<br>- ')
        });
    }
    let emptyFolders = pack.folders.filter(i => !i.contents.length);
    if (emptyFolders.length) await Folder.deleteDocuments(emptyFolders.map(i => i._id), {pack: key});
}
export function preCreateActor(actor, updates, options, userId) {
    if (game.user.id != userId) return;
    let key = genericUtils.getCPRSetting('backupCompendium');
    if (key === '') return;
    if (actor.pack != key || actor.flags['chris-premades']?.backup?.time) return;
    actor.updateSource({'flags.chris-premades.backup.time': Date.now()});
}
export let backup = {
    selectCompendium,
    doBackup,
    preCreateActor
};