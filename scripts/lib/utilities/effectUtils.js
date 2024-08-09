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
    return getCastData(effect)?.saveDC;
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
    if (identifier) genericUtils.setProperty(effectData, 'flags.chris-premades.info.identifier', identifier);
    if (parentEntity) genericUtils.setProperty(effectData, 'flags.chris-premades.parentEntityUuid', parentEntity.uuid);
    if (concentrationEffect) genericUtils.setProperty(effectData, 'flags.chris-premades.concentrationEffectUuid', concentrationEffect.uuid);
    if (interdependent && (parentEntity || concentrationItem)) genericUtils.setProperty(effectData, 'flags.chris-premades.interdependent', true);
    if (vae) genericUtils.setProperty(effectData, 'flags.chris-premades.vae.buttons', vae);
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
    return effect.flags['chris-premades']?.info?.identifier;
}
function getConcentrationEffect(actor, item) {
    return MidiQOL.getConcentrationEffect(actor, item);
}
function getEffectByIdentifier(actor, name) {
    return actorUtils.getEffects(actor).find(i => getEffectIdentifier(i) === name);
}
function getAllEffectsByIdentifier(actor, name) {
    return actorUtils.getEffects(actor).filter(i => getEffectIdentifier(i) === name);
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
            effectUtils.createEffect(i.actor, effectData);
        }
    });
}
async function toggleSidebarEffect(documentId) {
    await sidebarEffectHelper(documentId, true);
}
async function addSidebarEffect(documentId) {
    await sidebarEffectHelper(documentId, false);
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
    getAllEffectsByIdentifier,
    getEffectByStatusID,
    applyConditions,
    toggleSidebarEffect,
    addSidebarEffect
};