import {socket} from '../sockets.js';
import {genericUtils, socketUtils} from '../../utils.js';
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
function getTokens(actor) {
    return actor.getActiveTokens();
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
function getCastData(actor) {
    return actor.flags['chris-premades']?.castData;
}
function getCastLevel(actor) {
    return getCastData(actor)?.castLevel;
}
function getBaseLevel(actor) {
    return getCastData(actor)?.baseLevel;
}
function getSaveDC(actor) {
    return getCastData(actor)?.saveDC;
}
async function getSidebarActor(actor, {autoImport} = {}) {
    if (!actor.compendium) return actor;
    let sidebarActor = game.actors.find(i => i.flags.core?.sourceId === actor.uuid);
    if (!sidebarActor && autoImport) {
        if (!game.user.can('ACTOR_CREATE')) {
            let actorUuid = await socket.executeAsGM('createSidebarActor', actor.uuid);
            sidebarActor = await fromUuid(actorUuid);
        } else {
            let actorData = actor.toObject();
            genericUtils.setProperty(actorData, 'flags.core.sourceId', actor.uuid);
            sidebarActor = await Actor.create(actorData);
        }
    }
    return sidebarActor;
}
function getSize(actor, returnString) {
    switch(actor.system.traits.size) {
        case 'tiny':
            return returnString ? 'tiny' : 0;
        case 'sm':
            return returnString ? 'small' : 1;
        case 'med':
            return returnString ? 'medium' : 2;
        case 'lg':
            return returnString ? 'large' : 3;
        case 'huge':
            return returnString ? 'huge': 4;
        case 'grg':
            return returnString ? 'gargantuan' : 5;
    }
}
export let actorUtils = {
    getEffects,
    addFavorites,
    getFirstToken,
    getLevelOrCR,
    checkTrait,
    typeOrRace,
    getAlignment,
    getCRFromProf,
    getCastLevel,
    getBaseLevel,
    getSaveDC,
    getCastData,
    getSidebarActor,
    getTokens,
    getSize
};