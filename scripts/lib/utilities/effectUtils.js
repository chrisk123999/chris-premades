import {socket} from '../sockets.js';
import {actorUtils, genericUtils, socketUtils} from '../../utils.js';
function getCastData(effect) {
    return effect.flags['chris-premades']?.castData ?? effect.flags['midi-qol']?.castData;
}
function getCastLevel(effect) {
    return getCastData(effect)?.castLevel;
}
function getBaseLevel(effect) {
    return getCastData(effect)?.baseLevel;
}
async function setCastData(effect, data) {
    await effect.setFlag('chris-premades', 'castData', data);
}
async function setCastLevel(effect, level) {
    let data = getCastData(effect) ?? {};
    data.castLevel = level;
    await setCastData(effect, data);
}
async function setBaseLevel(effect, level) {
    let data = getCastData(effect) ?? {};
    data.baseLevel = level;
    await setCastData(effect, data);
}
function getSaveDC(effect) {
    return getCastData(effect)?.castDC;
}
async function setSaveDC(effect, dc) {
    let data = getCastData(effect) ?? {};
    data.saveDC = dc;
    await setCastData(effect, data);
}
async function createEffect(actor, effectData, {concentrationItem, parentEntity, identifier, vae} = {}) {
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (identifier) genericUtils.setProperty(effectData, 'flags.chris-premades.identifier', identifier);
    if (vae) {
        if (vae.button) genericUtils.setProperty(effectData, 'flags.chris-premades.vae.button', vae.button);
        if (vae.description) {/* empty */} //TODO
    }
    let effects;
    if (hasPermission) {
        effects = await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
        if (concentrationItem) {
            let concentrationEffect = getConcentrationEffect(concentrationItem.actor, concentrationItem);
            if (concentrationEffect) addDependents(concentrationEffect, effects[0]);
        }
        if (parentEntity) {
            addDependents(parentEntity, effects);
        }
    } else {
        effects = await socket.executeAsGM('createEffect', effectData, {concentrationItemUuid: concentrationItem?.uuid, parentEntityUuid: parentEntity?.uuid});
    }
    if (effects?.length) return effects[0];
}
async function addDependents(entity, dependents) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    if (hasPermission) {
        entity.addDependents(...dependents);
    } else {
        socket.executeAsGM('addDependents', entity.uuid, dependents.map(i => i.uuid));
    }
}
function addMacro(effectData, type, macroList) {
    return genericUtils.setProperty(effectData, 'flags.chris-premades.macros.' + type, macroList);
}
function getEffectIdentifier(effect) {
    return effect.flags['chris-premades']?.identifier;
}
function getConcentrationEffect(actor, item) {
    return MidiQOL.getConcentrationEffect(actor, item);
}
function getEffectByIdentifier(actor, name) {
    return actorUtils.getEffects(actor).find(i => getEffectIdentifier(i) === name);
}
export let effectUtils = {
    getCastData,
    getCastLevel,
    getBaseLevel,
    setCastData,
    setCastLevel,
    setBaseLevel,
    getSaveDC,
    setSaveDC,
    createEffect,
    addDependents,
    addMacro,
    getEffectIdentifier,
    getConcentrationEffect,
    getEffectByIdentifier
};