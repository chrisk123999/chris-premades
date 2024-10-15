import {socket, sockets} from '../sockets.js';
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
    return getCastData(effect)?.saveDC;
}
async function setSaveDC(effect, dc) {
    let data = getCastData(effect) ?? {};
    data.saveDC = dc;
    await setCastData(effect, data);
}
async function createEffect(entity, effectData, {concentrationItem, parentEntity, identifier, vae, interdependent, strictlyInterdependent, keepId} = {}) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    let concentrationEffect;
    if (concentrationItem) concentrationEffect = getConcentrationEffect(concentrationItem.actor, concentrationItem);
    if (identifier) genericUtils.setProperty(effectData, 'flags.chris-premades.info.identifier', identifier);
    if (parentEntity) genericUtils.setProperty(effectData, 'flags.chris-premades.parentEntityUuid', parentEntity.uuid);
    if (concentrationEffect) genericUtils.setProperty(effectData, 'flags.chris-premades.concentrationEffectUuid', concentrationEffect.uuid);
    if (interdependent && (parentEntity || concentrationItem)) genericUtils.setProperty(effectData, 'flags.chris-premades.interdependent', true);
    if (strictlyInterdependent) {
        let existingDependents = effectData.flags?.dnd5e?.dependents ?? [];
        if (parentEntity) existingDependents.push({uuid: parentEntity.uuid});
        if (concentrationEffect) existingDependents.push({uuid: concentrationEffect.uuid});
        if (existingDependents.length) genericUtils.setProperty(effectData, 'flags.dnd5e.dependents', existingDependents);
    }
    if (vae) genericUtils.setProperty(effectData, 'flags.chris-premades.vae.buttons', vae);
    let effects;
    if (hasPermission) {
        effects = await entity.createEmbeddedDocuments('ActiveEffect', [effectData]);
        if (concentrationEffect) await addDependent(concentrationEffect, effects);
        if (parentEntity) await addDependent(parentEntity, effects);
    } else {
        effects = [await socket.executeAsGM(sockets.createEffect.name, entity.uuid, effectData, {concentrationItemUuid: concentrationItem?.uuid, parentEntityUuid: parentEntity?.uuid})];
        effects = await Promise.all(effects.map(async i => await fromUuid(i)));
    }
    if (effects?.length) return effects[0];
}
async function createEffects(entity, effectDataArray, effectOptionsArray) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    let concentrationEffects = [];
    for (let i = 0; i < effectDataArray.length; i++) {
        let effectData = effectDataArray[i];
        let {concentrationItem, parentEntity, identifier, vae, interdependent, strictlyInterdependent} = effectOptionsArray[i];
        let concentrationEffect;
        if (concentrationItem) concentrationEffect = getConcentrationEffect(concentrationItem.actor, concentrationItem);
        if (identifier) genericUtils.setProperty(effectData, 'flags.chris-premades.info.identifier', identifier);
        if (parentEntity) genericUtils.setProperty(effectData, 'flags.chris-premades.parentEntityUuid', parentEntity.uuid);
        if (concentrationEffect) genericUtils.setProperty(effectData, 'flags.chris-premades.concentrationEffectUuid', concentrationEffect.uuid);
        if (interdependent && (parentEntity || concentrationItem)) genericUtils.setProperty(effectData, 'flags.chris-premades.interdependent', true);
        if (vae) genericUtils.setProperty(effectData, 'flags.chris-premades.vae.buttons', vae);
        if (strictlyInterdependent) {
            let existingDependents = effectData.flags?.dnd5e?.dependents ?? [];
            if (parentEntity) existingDependents.push({uuid: parentEntity.uuid});
            if (concentrationEffect) existingDependents.push({uuid: concentrationEffect.uuid});
            if (existingDependents.length) genericUtils.setProperty(effectData, 'flags.dnd5e.dependents', existingDependents);
        }
        concentrationEffects.push(concentrationEffect);
    }
    let effects;
    if (hasPermission) {
        effects = await entity.createEmbeddedDocuments('ActiveEffect', effectDataArray);
        for (let i = 0; i < effects.length; i++) {
            if (concentrationEffects[i]) await addDependent(concentrationEffects[i], [effects[i]]);
            if (effectOptionsArray[i].parentEntity) await addDependent(effectOptionsArray[i].parentEntity, [effects[i]]);
        }
    } else {
        effects = await socket.executeAsGM(sockets.createEffects.name, entity.uuid, effectDataArray, {concentrationItemUuidArray: effectOptionsArray.map(i => i.concentrationItem?.uuid), parentEntityUuidArray: effectOptionsArray.map(i => i.parentEntity?.uuid)});
        effects = await Promise.all(effects.map(async i => await fromUuid(i)));
    }
    if (effects?.length) return effects;
}
async function addDependent(entity, dependents) {
    let hasPermission = socketUtils.hasPermission(entity, game.user.id);
    if (hasPermission) {
        await entity.addDependent(...dependents);
    } else {
        socket.executeAsGM(sockets.addDependent.name, entity.uuid, dependents.map(i => i.uuid));
    }
}
function addMacro(effectData, type, macroList) {
    let currentMacroList = genericUtils.getProperty(effectData, 'flags.chris-premades.macros.' + type) ?? [];
    return genericUtils.setProperty(effectData, 'flags.chris-premades.macros.' + type, currentMacroList.concat(macroList));
}
function getConcentrationEffect(actor, item) {
    return MidiQOL.getConcentrationEffect(actor, item);
}
function getEffectByIdentifier(actor, name) {
    return actorUtils.getEffects(actor).find(i => genericUtils.getIdentifier(i) === name);
}
function getAllEffectsByIdentifier(actor, name) {
    return actorUtils.getEffects(actor).filter(i => genericUtils.getIdentifier(i) === name);
}
function getEffectByStatusID(actor, statusID) {
    return actorUtils.getEffects(actor).find(i => i.id === CONFIG.statusEffects.find(j => j.id === statusID)?._id);
}
async function applyConditions(actor, conditions, {overlay = false} = {}) {
    let updates = [];
    await Promise.all(conditions.map(async i => {
        if (actorUtils.checkTrait(actor, 'ci', i)) return;
        let cEffect = getEffectByStatusID(actor, i);
        if (cEffect) return;
        let effectImplementation = await ActiveEffect.implementation.fromStatusEffect(i);
        if (!effectImplementation) return;
        let effectData = effectImplementation.toObject();
        if (overlay) genericUtils.setProperty(effectData, 'flags.core.overlay', true);
        updates.push(effectData);
    }));
    if (updates.length) return await genericUtils.createEmbeddedDocuments(actor, 'ActiveEffect', updates, {keepId: true});
}
async function sidebarEffectHelper(documentId, toggle) {
    let effectsItem = game.items.find(i => i.flags['chris-premades']?.effectInterface);
    let document = effectsItem?.collections?.effects?.get(documentId);
    if (!document) return;
    let selectedTokens = canvas.tokens.controlled;
    if (!selectedTokens.length) {
        genericUtils.notify('CHRISPREMADES.EffectInterface.SelectToken', 'warn');
        return;
    }
    let effectData = document.toObject();
    delete effectData.id;
    genericUtils.setProperty(effectData, 'duration.startTime', game.time.worldTime);
    genericUtils.setProperty(effectData, 'flags.chris-premades.effectInterface.id', document.id);
    selectedTokens.forEach(i => {
        if (!i.actor) return;
        effectData.origin = i.actor.uuid;
        let effect = actorUtils.getEffects(i.actor).find(i => i.flags['chris-premades']?.effectInterface?.id === document.id);
        let stackable = effect?.flags.dae?.stackable === 'count';
        let stackCount = effect?.flags.dae?.stacks ?? 1;
        if (effect && toggle) {
            if (!stackable || stackCount === 1) {
                genericUtils.remove(effect);
            } else {
                genericUtils.update(effect, {'flags.dae.stacks': stackCount - 1});
            }
        } else if (effect && stackable) {
            genericUtils.update(effect, {'flags.dae.stacks': stackCount + 1});
        } else {
            if (effectData.flags['chris-premades']?.effectInterface?.status || effectData.flags['chris-premades']?.effectInterface?.customStatus) {
                genericUtils.createEmbeddedDocuments(i.actor, 'ActiveEffect', [effectData], {keepId: true});
            } else {
                effectUtils.createEffect(i.actor, effectData);
            }
        }
    });
}
async function toggleSidebarEffect(documentId) {
    await sidebarEffectHelper(documentId, true);
}
async function addSidebarEffect(documentId) {
    await sidebarEffectHelper(documentId, false);
}
function getSidebarEffectData(name) {
    let effectsItem = game.items.find(i => i.flags['chris-premades']?.effectInterface);
    if (!effectsItem) return;
    let effect = effectsItem.collections.effects.getName(name);
    if (!effect) return;
    let effectData = effect.toObject();
    if (!(effect.flags['chris-premades']?.effectInterface?.customStatus || effect.flags['chris-premades']?.effectInterface?.status)) delete effectData._id;
    delete effectData.origin;
    return effectData;
}
async function createEffectFromSidebar(actor, name, options) {
    let effectData = getSidebarEffectData(name);
    if (!effectData) return;
    return await createEffect(actor, effectData, options);
}
async function syntheticActiveEffect(effectData, entity) {
    return new CONFIG.ActiveEffect.documentClass(effectData, {parent: entity});
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
    createEffects,
    addDependent,
    addMacro,
    getConcentrationEffect,
    getEffectByIdentifier,
    getAllEffectsByIdentifier,
    getEffectByStatusID,
    applyConditions,
    toggleSidebarEffect,
    addSidebarEffect,
    syntheticActiveEffect,
    getSidebarEffectData,
    createEffectFromSidebar
};