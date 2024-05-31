import {socket} from '../sockets.js';
import {socketUtils} from './socketUtils.js';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function translate(key) {
    return game.i18n.localize(key);
}
function setProperty(object, key, value) {
    return foundry.utils.setProperty(object, key, value);
}
function duplicate(object) {
    return foundry.utils.duplicate(object);
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
    if (hasPermission) await entity.delete();
    await socket.executeAsGM('deleteEntity', entity.uuid);
}
export let genericUtils = {
    sleep,
    translate,
    setProperty,
    duplicate,
    update,
    remove,
    setFlag
};