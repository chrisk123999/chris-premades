export async function info({speaker, actor, token, character, item, args, scope, workflow}) {
    let info = item?.flags?.['chris-premades']?.info;
    if (!info) return;
    let message = '';
    let cancel = false;
    if (info.version) {
        let currentVersion = CONFIG.chrisPremades.automations[info.name].version;
        let itemVersion = info.version;
        console.log(currentVersion, itemVersion);
        if (isNewerVersion(currentVersion, itemVersion)) {
            message += '@UUID[' + item.uuid + ']{' + item.name + '} automation is out of date!<br>Item Version: ' + itemVersion + '<br>Updated Version: ' + currentVersion;
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
                let settingName = game.settings.settings.get('chris-premades.' + i).name;
                message += '<br>' + settingName;
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
                if (mutationStack.getName(info.mutation.self)) {
                    await warpgate.revert(token.document, info.mutation.self);
                    console.warn('A duplicate CPR Warpgate mutation was detected and removed!');
                }
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
            'speaker': {'alias': 'Chris\'s Premades'},
            'content': message
        });
        return false;
    }
}
export async function setCompendiumItemInfo(key) {
    let gamePack = game.packs.get(key);
    await gamePack.getDocuments();
    for (let i of gamePack.contents) {
        let name = i.flags['chris-premades']?.info?.name ?? i.name;
        if (CONFIG.chrisPremades.automations[name]) {
            await i.setFlag('chris-premades', 'info', CONFIG.chrisPremades.automations[name]);
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
export async function updateAllCompendiums() {
    let packs = game.packs.filter(i => i.metadata.label.includes('CPR') && i.metadata.packageType === 'world');
    for (let i of packs) {
        await stripUnusedFlags(i.metadata.id);
        await setCompendiumItemInfo(i.metadata.id);
    }
    return 'Done!';
}