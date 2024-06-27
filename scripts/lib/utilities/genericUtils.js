import {socket} from '../sockets.js';
import {socketUtils} from '../../utils.js';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function translate(key) {
    return game.i18n.localize(key);
}
function format(key, obj) {
    return game.i18n.format(key, obj);
}
function setProperty(object, key, value) {
    return foundry.utils.setProperty(object, key, value);
}
function getProperty(object, key) {
    return foundry.utils.getProperty(object, key);
}
function duplicate(object) {
    return foundry.utils.duplicate(object);
}
function deepClone(object) {
    return foundry.utils.deepClone(object);
}
function mergeObject(original, other) {
    return foundry.utils.mergeObject(original, other);
}
async function update(entity, updates) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    if (hasPermission) return await entity.update(updates);
    await socket.executeAsGM('updateEntity', entity.uuid, updates);
}
async function setFlag(entity, scope, key, value) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    if (hasPermission) return await entity.setFlag(scope, key, value);
    await socket.executeAsGM('setFlag', entity.uuid, scope, key, value);
}
async function remove(entity) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    if (hasPermission) return await entity.delete();
    await socket.executeAsGM('deleteEntity', entity.uuid);
}
function decimalToFraction(decimal) {
    if (!decimal) return 0;
    if (Number(decimal) >= 1) return Number(decimal);
    return '1/' + 1 / Number(decimal);
}
function getCPRSetting(key) {
    return game.settings.get('chris-premades', key);
}
async function setCPRSetting(key, value) {
    return game.settings.set('chris-premades', key, value);
}
function isNewerVersion(v1, v0) {
    return foundry.utils.isNewerVersion(v1, v0);
}
function randomID(value) {
    return foundry.utils.randomID(value);
}
function checkMedkitPermission(permission, userId) {
    let settingKey = undefined;
    switch (permission) {
        case 'update': settingKey = 'permissionsUpdateItem';
            break;
        case 'automate': settingKey = 'permissionsAutomateItem';
            break;
        case 'configure': settingKey = 'permissionsConfigureItem';
            break;
        case 'homebrew': settingKey = 'permissionsConfigureHomebrew';
            break;
        default:
            return undefined;
    }
    let user = game.users.get(userId);
    let userRole = user.role;
    let neededRole = getCPRSetting(settingKey);
    if (!neededRole) return undefined;
    if (userRole >= neededRole) return true;
    else return false;
}
function notify(message, type, {localize = true} = {}) {
    ui.notifications[type](message, {localize: localize});
}
async function createEmbeddedDocuments(entity, type, updates, options) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    let documents;
    if (hasPermission) {
        documents = await entity.createEmbeddedDocuments(type, updates, options);
    } else {
        let documentUuids = await socket.executeAsGM('createEmbeddedDocuments', entity.uuid, type, updates, options);
        documents = await Promise.all(documentUuids.map(async i => await fromUuid(i)));
    }
    return documents;
}
export let genericUtils = {
    sleep,
    translate,
    format,
    setProperty,
    duplicate,
    update,
    remove,
    setFlag,
    deepClone,
    mergeObject,
    getCPRSetting,
    decimalToFraction,
    isNewerVersion,
    randomID,
    checkMedkitPermission,
    notify,
    setCPRSetting,
    createEmbeddedDocuments,
    getProperty
};