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
async function createEffect(entity, effectData, {concentrationItem, parentEntity, identifier, vae, interdependent, strictlyInterdependent} = {}) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    let concentrationEffect;
    if (concentrationItem) concentrationEffect = getConcentrationEffect(concentrationItem.actor, concentrationItem);
    if (identifier) genericUtils.setProperty(effectData, 'flags.chris-premades.identifier', identifier);
    if (parentEntity) genericUtils.setProperty(effectData, 'flags.chris-premades.parentEntityUuid', parentEntity.uuid);
    if (concentrationEffect) genericUtils.setProperty(effectData, 'flags.chris-premades.concentrationEffectUuid', concentrationEffect.uuid);
    if (interdependent && (parentEntity || concentrationItem)) genericUtils.setProperty(effectData, 'flags.chris-premades.interdependent', true);
    if (vae) {
        if (vae.button) genericUtils.setProperty(effectData, 'flags.chris-premades.vae.button', vae.button);
        if (vae.description) {/* empty */} //TODO
    }
    let effects;
    if (hasPermission) {
        effects = await entity.createEmbeddedDocuments('ActiveEffect', [effectData]);
        if (concentrationEffect) {
            await addDependent(concentrationEffect, effects);
            if (strictlyInterdependent) await addDependent(effects[0], [concentrationEffect]);
        }
        if (parentEntity) {
            await addDependent(parentEntity, effects);
            if (strictlyInterdependent) await addDependent(effects[0], [parentEntity]);
        }
    } else {
        effects = await socket.executeAsGM('createEffect', entity.uuid, effectData, {concentrationItemUuid: concentrationItem?.uuid, parentEntityUuid: parentEntity?.uuid});
    }
    if (effects?.length) return effects[0];
}
async function addDependent(entity, dependents) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    if (hasPermission) {
        await entity.addDependent(...dependents);
    } else {
        socket.executeAsGM('addDependent', entity.uuid, dependents.map(i => i.uuid));
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
function getEffectByStatusID(actor, statusID) {
    return actorUtils.getEffects(actor).find(i => i.statuses.has(statusID));
}
async function applyConditions(actor, conditions) {
    let updates = [];
    await Promise.all(conditions.map(async i => {
        let cEffect = getEffectByStatusID(actor, i);
        if (cEffect) return;
        let effectImplementation = await ActiveEffect.implementation.fromStatusEffect(i);
        if (!effectImplementation) return;
        let effectData = effectImplementation.toObject();
        updates.push(effectData);
    }));
    if (updates.length) return await genericUtils.createEmbeddedDocuments(actor, 'ActiveEffect', updates, {keepId: true});
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
    addDependent,
    addMacro,
    getEffectIdentifier,
    getConcentrationEffect,
    getEffectByIdentifier,
    getEffectByStatusID,
    applyConditions
};