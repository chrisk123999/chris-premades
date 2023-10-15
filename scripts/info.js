export async function info({speaker, actor, token, character, item, args, scope, workflow}) {
    let info = item?.flags?.['chris-premades']?.info;
    if (!info) return;
    let message = '';
    let cancel = false;
    if (info.version) {
        let currentVersion = CONFIG.chrisPremades.automations[info.name].version;
        let itemVersion = info.version;
        if (isNewerVersion(currentVersion, itemVersion)) {
            message += 'Automation is out of date!<br>Item Version: ' + itemVersion + '<br>Updated Version: ' + currentVersion;
            cancel = true;
        }
    }
    if (info.settings) {
        let missingSettings = [];
        for (let i of info.settings) {
            if (!game.settings.get('chris-premades', i)) missingSettings.push(i);
        }
        if (missingSettings.length > 0) {
            if (message != '') message += '<hr>';
            message += 'This automation requires the following settings to be enabled:';
            for (let i of missingSettings) {
                message += '<br>' + i;
            }
            cancel = true;
        }
    }
    if (info.mutation) {
        if (info.mutation.self) {
            if (!token) {
                if (message != '') message += '<hr>';
                message += 'This automation requires your token to be on the scene.';
                cancel = true;
            } else {
                let mutationStack = warpgate.mutationStack(token.document);
                if (mutationStack.getName(info.mutation.self)) await warpgate.revert(token.document, info.mutation.self);
                console.warn('A duplicate CPR Warpgate mutation was detected and removed!');
            }
        }
    }
    if (info.actors) {
        let missingActors = [];
        for (let i of info.actors) {
            if (!game.actors.getName(i)) missingActors.push(i);
        }
        if (missingActors.length > 0) {
            if (message != '') message += '<hr>';
            message += 'This automation requires the following sidebar actors:';
            for (let i of missingActors) {
                message += '<br>' + i;
            }
            cancel = true;
        }
    }
    if (cancel) {
        ChatMessage.create({
            'speaker': {alias: name},
            'content': message
        });
        return false;
    }
}
export async function setCompendiumItemInfo(key) {
    let gamePack = game.packs.get(key);
    await gamePack.getDocuments();
    for (let i of gamePack.contents) {
        if (CONFIG.chrisPremades.automations[i.name]) {
            await i.setFlag('chris-premades', 'info', CONFIG.chrisPremades.automations[i.name]);
        }
    }
}
export async function stripUnusedFlags(key) {
    let gamePack = game.packs.get(key);
    await gamePack.getDocuments();
    for (let i of gamePack.contents) {
        await i.update({
            'flags.-=ddbimporter': null,
            'flags.-=itemacro': null
        });
    }
}
export async function setItemName(uuid, name) {
    let item = await fromUuid(uuid);
    if (!item) return;
    await item.update({
        'flags.-=ddbimporter': null,
        'flags.-=itemacro': null
    });
}
export async function removeFolderFlag(uuid) {
    let item = await fromUuid(uuid);
    if (!item) return;
    await item.update({
        'flags.-=cf': null
    });
}
export async function setFolder(monsterName, type) {
    let folderAPI = game.CF.FICFolderAPI;
    let allFolders = await folderAPI.loadFolders('world.cpr-monster-features');
    if (!allFolders) return 'Failed! (Step 1)';
    let monsterFolder = allFolders.find(f => f.name === monsterName);
    let typeFolder = allFolders.find(f => f.name === type);
    if (!type) return 'Failed! (Step 2)';
    if (!monsterFolder) {
        let folderData = {
            'name': monsterName,
            'color': '#000000',
            'icon': '',
            'fontColor': '#FFFFFF'
        };
        await folderAPI.createFolderWithParentData(typeFolder, folderData);
        let count = 0;
        while (count < 5) {
            allFolders = await folderAPI.loadFolders('world.cpr-monster-features');
            await warpgate.wait(1000);
            count += 1;
            if (allFolders) break;
        }
        if (!allFolders) return 'Failed! (Step 3)';
        monsterFolder = allFolders.find(f => f.name === monsterName);
    }
    let gamePack = game.packs.get('world.cpr-monster-features');
    let allDocumentsInFolders = allFolders.map(f => f.contents).deepFlatten();
    let index = await gamePack.getIndex();
    let allDocuments = index.filter(i => i.name != game.CF.TEMP_ENTITY_NAME).map(i => i._id);
    let noFolderIds = [];
    for (let document of allDocuments) if (!allDocumentsInFolders.includes(document)) noFolderIds.push(document);
    for (let i of noFolderIds) await folderAPI.moveDocumentIntoFolder(i, monsterFolder);
    folderAPI.clearCache();
    return 'Success!'
}