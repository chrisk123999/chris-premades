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
    let hasPermission = socketUtils.hasPermission(effect, game.user.id);
    if (hasPermission) await entity.update(updates);
    await socket.executeAsGM('updateEntity', entity.uuid, updates);
    
}
export let genericUtils = {
    sleep,
    translate,
    setProperty,
    duplicate,
    update
};