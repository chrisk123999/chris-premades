import {chris} from './helperFunctions.js';
import {updateItem} from './item.js';
export async function info({speaker, actor, token, character, item, args, scope, workflow}) {
    let info = item?.flags?.['chris-premades']?.info;
    if (!info) return;
    let message = '';
    let gmMessage = '<hr>';
    let cancel = false;
    let updateItem = false;
    if (info.version) {
        let currentVersion = CONFIG.chrisPremades.automations[info.name].version;
        let itemVersion = info.version;
        if (isNewerVersion(currentVersion, itemVersion)) {
            message += '<hr>@UUID[' + item.uuid + ']{' + item.name + '} automation is out of date!<br>Item Version: ' + itemVersion + '<br>Updated Version: ' + currentVersion;
            gmMessage += '<button class="chris-item-button">Update Item</button>'
            cancel = true;
            updateItem = true;
        }
    }
    let missingSettings = [];
    if (info.settings) {
        for (let i of info.settings) {
            if (!game.settings.get('chris-premades', i)) missingSettings.push(i);
        }
        if (missingSettings.length > 0) {
            if (message != '') message += '<hr>';
            message += 'This automation requires the following settings to be enabled:';
            gmMessage += '<button class="chris-settings-button">Enable Required Settings</button>'
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
    let missingActors = [];
    if (info.actors) {
        for (let i of info.actors) {
            if (!game.actors.getName(i)) missingActors.push(i);
        }
        if (missingActors.length > 0) {
            if (message != '') message += '<hr>';
            message += 'This automation requires the following sidebar actors:';
            gmMessage += '<button class="chris-actors-button">Import Missing Actors</button>'
            for (let i of missingActors) {
                message += '<br>' + i;
            }
            cancel = true;
        }
    }
    if (cancel) {
        await ChatMessage.create({
            'speaker': {'alias': 'Chris\'s Premades'},
            'content': message
        });
        let messageData = {
            'speaker': {'alias': 'Chris\'s Premades'},
            'blind': true,
            'content': gmMessage
        };
        if (missingSettings.length) setProperty(messageData, 'flags.chris-premades.message.button.settings', missingSettings);
        if (missingActors.length) setProperty(messageData, 'flags.chris-premades.message.button.actors', missingActors);
        if (updateItem) setProperty(messageData, 'flags.chris-premades.message.button.item', item.uuid);
        await ChatMessage.create(messageData);
        return false;
    }
}
export async function buttonSettings(settings, element, message) {
    await Promise.all(settings.map(async setting => {
        await game.settings.set('chris-premades', setting, true);
    }));
    ui.notifications.info('Settings updated!');
}
export async function buttonActors(actors, element, message) {
    let folder = game.folders.find(i => i.name === 'Chris Premades' && i.type === 'Actor');
    if (!folder) {
        folder = await Folder.create({
            'name': 'Chris Premades',
            'type': 'Actor',
            'color': '#348f2d'
        });
    }
    await Promise.all(actors.map(async actor => {
        let actorData = await chris.getItemFromCompendium('chris-premades.CPR Summons', actor);
        if (!actorData) return;
        actorData.folder = folder.id;
        await Actor.create(actorData);
    }));
    ui.notifications.info('Actors imported!');
}
export async function buttonItem(itemUuid, element, message) {
    let item = await fromUuid(itemUuid);
    if (!item) return;
    await updateItem(item);
}
export async function setCompendiumItemInfo(key) {
    let gamePack = game.packs.get(key);
    await gamePack.getDocuments();
    for (let i of gamePack.contents) {
        let name = i.flags['chris-premades']?.info?.name ?? i.name;
        if (CONFIG.chrisPremades.automations[name]) await i.setFlag('chris-premades', 'info', CONFIG.chrisPremades.automations[name]);
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
    await Promise.all(packs.map(async i => {
        await stripUnusedFlags(i.metadata.id);
        await setCompendiumItemInfo(i.metadata.id);
    }));
    return 'Done!';
}
export async function checkPassiveEffects(packId) {
    let pack = game.packs.get(packId);
    if (!pack) return;
    await pack.getDocuments();
    let needsAdjusting = [];
    for (let item of pack.contents) {
        console.log('- Checking: ' + item.name);
        if (!item.effects.size) continue;
        let passiveEffects = item.effects.filter(i => i.transfer);
        if (!passiveEffects.length) continue;
        let effectMacroEffects = passiveEffects.filter(i => i.flags.effectmacro);
        if (!effectMacroEffects.length) continue;
        for (let effect of effectMacroEffects) {
            console.log('-- Checking Effect: ' + effect.name);
            let fixMe = Object.values(effect.flags.effectmacro).find(i => {
                if (typeof i.script != 'string') return false;
                if (i.script.includes('origin')) return true;
                return false;
            });
            if (fixMe) needsAdjusting.push(effect.uuid);
        }
    }
    if (!needsAdjusting.length) return;
    let message = '<hr>The following effects need to be adjusted:';
    for (let uuid of needsAdjusting) {
        let effect = await fromUuid(uuid);
        message += '<br>@UUID[' + uuid + ']{' + effect.name + '}<br>';
    }
    await ChatMessage.create({
        'speaker': {'alias': 'Chris\'s Premades - ' + pack.metadata.label},
        'content': message
    });
}
export async function checkPackEffects(moduleId) {
    let packs = game.packs.filter(i => i.metadata.packageName === moduleId && i.metadata.type === 'Item');
    for (let pack of packs) {
        console.log('Checking Pack: ' + pack.metadata.label);
        await checkPassiveEffects(pack.metadata.id);
    }
}