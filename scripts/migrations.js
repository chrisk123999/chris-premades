import {genericUtils} from './utils.js';

export async function migrate() {
    let sortedMigrations = Object.entries(migrations).sort((a, b) => {
        return foundry.utils.isNewerVersion(b[0], a[0]) ? -1 : 1;
    });
    let migrationVersion = genericUtils.getCPRSetting('migrationVersion');
    for (let [version, migration] of sortedMigrations) {
        if (!foundry.utils.isNewerVersion(version, migrationVersion)) continue;
        await migration();
    }

    let moduleVersion = game.modules.get('chris-premades').version;
    await genericUtils.setCPRSetting('migrationVersion', moduleVersion);
}

const migrations = {
    '1.1.0': async () => {
        let oldFolderIds = [];
        let realOldFolder = game.folders.getName('Chris\'s Premades');
        if (realOldFolder) {
            oldFolderIds.push(realOldFolder.id);
            let oldInternalFolder = realOldFolder.getSubfolders()[0];
            if (oldInternalFolder) oldFolderIds.push(oldInternalFolder.id);
        }
        let origFolder = game.folders.getName('Cauldron of Plentiful Resources');
        if (!origFolder) {
            origFolder = await Folder.implementation.create({
                color: '#348f2d',
                name: 'Cauldron of Plentiful Resources',
                type: 'Compendium'
            });
        } else {
            oldFolderIds.push(origFolder.id);
        }
        let subfolder2014 = origFolder.getSubfolders().find(i => i.name === '2014');
        if (!subfolder2014) {
            subfolder2014 = await Folder.implementation.create({
                color: '#348f2d',
                name: '2014',
                type: 'Compendium',
                folder: origFolder.id
            });
        }
        let config = game.settings.get('core', 'compendiumConfiguration');
        let exclude = ['chris-premades.CPRMiscellaneous', 'chris-premades.CPRMiscellaneousItems'];
        for (let [id, conf] of Object.entries(config)) {
            if (oldFolderIds.includes(conf.folder) && !exclude.includes(id)) conf.folder = subfolder2014.id;
        }
        game.settings.set('core', 'compendiumConfiguration', config);
    }
};