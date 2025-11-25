import {socket, sockets} from '../sockets.js';
import {socketUtils, constants} from '../../utils.js';
import * as legacyMacros from '../../legacyMacros.js';
import * as modernMacros from '../../macros.js';
let cachedSettings = {};
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
function mergeObject(original, other, options={}) {
    return foundry.utils.mergeObject(original, other, options);
}
async function update(entity, updates={}, options={}) {
    let hasPermission = socketUtils.hasPermission(entity.documentName === 'Activity' ? entity.item : entity, game.user.id);
    if (hasPermission) return await entity.update(updates, options);
    return await socket.executeAsGM(sockets.updateEntity.name, entity.uuid, updates);
}
async function setFlag(entity, scope, key, value) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    if (hasPermission) return await entity.setFlag(scope, key, value);
    return await socket.executeAsGM(sockets.setFlag.name, entity.uuid, scope, key, value);
}
async function unsetFlag(entity, scope, key) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    if (hasPermission) return await entity.unsetFlag(scope, key);
    return await socket.executeAsGM(sockets.unsetFlag.name, entity.uuid, scope, key);
}
async function remove(entity) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    if (hasPermission) return await entity.delete();
    return await socket.executeAsGM(sockets.deleteEntity.name, entity.uuid);
}
function decimalToFraction(decimal) {
    if (!decimal) return 0;
    if (Number(decimal) >= 1) return Number(decimal);
    return '1/' + 1 / Number(decimal);
}
function getCPRSetting(key) {
    let setting = getProperty(cachedSettings, key);
    if (setting) return setting;
    setting = game.settings.get('chris-premades', key);
    setProperty(cachedSettings, key, setting);
    return setting;
}
async function setCPRSetting(key, value) {
    return game.settings.set('chris-premades', key, value);
}
async function createUpdateSetting({key, value}) {
    if (key?.split('.')[0] !== 'chris-premades') return;
    key = key.split('.').slice(1).join('.');
    setProperty(cachedSettings, key, value);
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
function notify(message, type = 'info', {localize = true, permanent = false} = {}) {
    ui.notifications[type](message, {localize: localize, permanent: permanent});
}
async function createEmbeddedDocuments(entity, type, updates, options) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    let documents;
    if (hasPermission) {
        documents = await entity.createEmbeddedDocuments(type, updates, options);
    } else {
        let documentUuids = await socket.executeAsGM(sockets.createEmbeddedDocuments.name, entity.uuid, type, updates, options);
        documents = await Promise.all(documentUuids.map(async i => await fromUuid(i)));
    }
    return documents;
}
async function updateEmbeddedDocuments(entity, type, updates, options) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    let documents;
    if (hasPermission) {
        documents = await entity.updateEmbeddedDocuments(type, updates, options);
    } else {
        let documentUuids = await socket.executeAsGM(sockets.updateEmbeddedDocuments.name, entity.uuid, type, updates, options);
        documents = await Promise.all(documentUuids.map(async i => await fromUuid(i)));
    }
    return documents;
}
async function deleteEmbeddedDocuments(entity, type, ids, options) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    let documents;
    if (hasPermission) {
        documents = await entity.deleteEmbeddedDocuments(type, ids, options);
    } else {
        let documentUuids = await socket.executeAsGM(sockets.deleteEmbeddedDocuments.name, entity.uuid, type, ids, options);
        documents = await Promise.all(documentUuids.map(async i => await fromUuid(i)));
    }
    return documents;
}
async function updateTargets(targets, user = game.user) {
    let targetIds = Array.from(targets).map(target => target.id ?? target);
    if (user === game.user) {
        canvas.tokens?.setTargets(targetIds);
    } else {
        await socket.executeAsUser(sockets.updateTargets.name, user.id, targetIds);
    }
}
function collapseObjects(...objects) {
    let object = {};
    objects.forEach(o => mergeObject(object, o));
    return object;
}
function log(type, message) {
    if (type === 'dev' && !getCPRSetting('devTools')) return;
    if (type === 'dev') type = 'log';
    console[type]('CPR: ' + message);
}
function titleCase(inputString) {
    return inputString.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
}
function camelCaseToWords(s) {
    const result = s.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
}
function getIdentifier(entity) {
    return entity.flags?.['chris-premades']?.info?.identifier;
}
function checkPlayerOwnership(entity) {
    if (!entity) return false;
    return Object.entries(entity.ownership).some(([userId, permission]) => {
        if (game.users.get(userId)?.isGM) return false;
        else if (permission === 3) return true;
        else return false;
    });
}
function getRules(entity) {
    if (entity.documentName === 'Item') return entity.system.source.rules === '' ? 'legacy' : entity.system.source.rules === '2014' ? 'legacy' : 'modern';
    return entity.flags['chris-premades']?.rules ?? 'legacy';
}
function getCPRIdentifier(name, rules = 'legacy') {
    let macros = rules === 'legacy' ? legacyMacros : modernMacros;
    let identifier = Object.entries(macros).find(i => i[1].name === name || i[1].aliases?.includes(name))?.[0];
    return identifier;
}
function getCPRIdentifiers(name, rules = 'legacy') {
    let macros = rules === 'legacy' ? legacyMacros : modernMacros;
    let identifiers = Object.entries(macros).filter(i => i[1].name === name || i[1].aliases?.includes(name)).map(i => i[0]);
    return identifiers;
}
function convertDistance(ft) {
    if (!canvas.scene) return ft;
    if (canvas.scene.grid.units !== 'm') return ft;
    return Math.floor((ft / 5) * 1.5);
}

function sanitizeNumber(input, defaultValue = 0, { math = 'none' } = {}) {
    if (!Number.isFinite(input)) {
        log('error', `sanitizeNumber: input '${input}' is not finite; returning ${defaultValue}`);
        return defaultValue;
    }
    switch (math) {
        case 'none':
            return input;
        case 'ceil':
            log('dev', `sanitizeNumber: applying ceil to ${input}`);
            return Math.ceil(input);
        case 'round':
            log('dev', `sanitizeNumber: applying round to ${input}`);
            return Math.round(input);
        case 'floor':
            log('dev', `sanitizeNumber: applying floor to ${input}`);
            return Math.floor(input);
        default:
            log('warn', `sanitizeNumber: unknown math op '${math}', returning input unchanged`);
            return input;
    }
}

function getDamageTypeMeta(override = {}) {
    const merged = {};
    for (const [type, data] of Object.entries(constants.DAMAGE_TYPES_TABLE)) {
        merged[type] = { ...data, ...(override[type] ?? {}) };
    }
    return merged;
}

function logDetailed(type, ...message) {
    if (type === 'dev' && !getCPRSetting('devTools')) return;
    if (type === 'dev') type = 'log';
    console[type]('CPR:', ...message);
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
    unsetFlag,
    deepClone,
    mergeObject,
    getCPRSetting,
    decimalToFraction,
    isNewerVersion,
    randomID,
    checkMedkitPermission,
    notify,
    setCPRSetting,
    createUpdateSetting,
    createEmbeddedDocuments,
    getProperty,
    updateTargets,
    collapseObjects,
    updateEmbeddedDocuments,
    deleteEmbeddedDocuments,
    log,
    titleCase,
    camelCaseToWords,
    getIdentifier,
    checkPlayerOwnership,
    getRules,
    getCPRIdentifier,
    convertDistance,
    getCPRIdentifiers,
    sanitizeNumber,
    getDamageTypeMeta,
    logDetailed
};