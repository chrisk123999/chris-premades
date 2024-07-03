import {socket} from '../sockets.js';
import {socketUtils} from '../../utils.js';
function getEffects(actor) {
    return Array.from(actor.allApplicableEffects());
}
async function addFavorites(actor, items) {
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (hasPermission) {
        for (let i of items) await actor.system.addFavorite({
            id: i.getRelativeUUID(i.actor),
            type: 'item'
        });
    } else {
        await socket.executeAsGM('addFavorites', actor.uuid, items.map(i => i.uuid));
    }
}
function getFirstToken(actor) {
    let tokens = actor.getActiveTokens();
    if (tokens.length) return tokens[0];
}
function getLevelOrCR(actor) {
    return actor.type === 'character' ? actor.system.details.level : actor.system.details.cr ?? 0;
}
function checkTrait(actor, type, trait) {
    return actor.system.traits?.[type]?.value?.has(trait);
}
function typeOrRace(actor) {
    return MidiQOL.typeOrRace(actor);
}
function getAlignment(actor) {
    return actor.system.details.alignment.toLowerCase();
}
function getCRFromProf(prof) {
    return 4 * prof - 7;
}
export let actorUtils = {
    getEffects,
    addFavorites,
    getFirstToken,
    getLevelOrCR,
    checkTrait,
    typeOrRace,
    getAlignment,
    getCRFromProf
};