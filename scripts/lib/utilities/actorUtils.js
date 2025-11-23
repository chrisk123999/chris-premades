import {socket, sockets} from '../sockets.js';
import {effectUtils, genericUtils, socketUtils} from '../../utils.js';
import {ActorMedkit} from '../../applications/medkit-actor.js';
function getEffects(actor, {includeItemEffects = false} = {}) {
    let effects = Array.from(actor.allApplicableEffects());
    if (!includeItemEffects) return effects;
    let enchantmentEffects = actor.items.contents.flatMap(item => item.effects.contents).filter(effect => effect.type === 'enchantment' && effect.isAppliedEnchantment);
    return effects.concat(enchantmentEffects);
}
async function addFavorites(actor, entities, type='item') {
    if (!actor.system.addFavorite) return;
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (hasPermission) {
        if (type === 'item') {
            for (let i of entities) await actor.system.addFavorite({
                id: i.getRelativeUUID(i.actor),
                type: 'item'
            });
        } else if (type === 'activity') {
            for (let i of entities) await actor.system.addFavorite({
                id: i.relativeUUID,
                type: 'activity'
            });
        }
    } else {
        await socket.executeAsGM(sockets.addFavorites.name, actor.uuid, entities.map(i => i.uuid));
    }
}
async function removeFavorites(actor, entities, type='item') {
    if (!actor.system.removeFavorite) return;
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (hasPermission) {
        if (type === 'item') {
            for (let i of entities) await actor.system.removeFavorite(i.getRelativeUUID(i.actor));
        } else if (type === 'activity') {
            for (let i of entities) await actor.system.removeFavorite(i.relativeUUID);
        }
    } else {
        await socket.executeAsGM(sockets.removeFavorites.name, actor.uuid, entities.map(i => i.uuid));
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
    return actor.system.details?.alignment?.toLowerCase();
}
function getCRFromProf(prof) {
    return 4 * prof - 7;
}
async function getSidebarActor(actor, {autoImport} = {}) {
    if (!actor.compendium) return actor;
    let sidebarActor = game.actors.find(i => i.flags.core?.sourceId === actor.uuid);
    if (!sidebarActor && autoImport) {
        if (!game.user.can('ACTOR_CREATE')) {
            let actorUuid = await socket.executeAsGM(sockets.createSidebarActor.name, actor.uuid);
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
            return returnString ? 'sm' : 1;
        case 'med':
            return returnString ? 'med' : 2;
        case 'lg':
            return returnString ? 'lg' : 3;
        case 'huge':
            return returnString ? 'huge': 4;
        case 'grg':
            return returnString ? 'grg' : 5;
    }
}
function hasUsedReaction(actor) {
    return MidiQOL.hasUsedReaction(actor);
}
async function setReactionUsed(actor) {
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (hasPermission) {
        return MidiQOL.setReactionUsed(actor);
    } else {
        return await socket.executeAsGM(sockets.setReactionUsed.name, actor.uuid);
    }
}
async function removeReactionUsed(actor, force = false) {
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (hasPermission) {
        return MidiQOL.removeReactionUsed(actor, force);
    } else {
        return await socket.executeAsGM(sockets.removeReactionUsed.name, actor.uuid, force);
    }
}
function hasUsedBonusAction(actor) {
    return MidiQOL.hasUsedBonusAction(actor);
}
async function setBonusActionUsed(actor) {
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (hasPermission) {
        return MidiQOL.setBonusActionUsed(actor);
    } else {
        return await socket.executeAsGM(sockets.setBonusActionUsed.name, actor.uuid);
    }
}
async function removeBonusActionUsed(actor, force=false) {
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (hasPermission) {
        return MidiQOL.removeBonusActionUsed(actor, force);
    } else {
        return await socket.executeAsGM(sockets.removeBonusActionUsed.name, actor.uuid, force);
    }
}
function hasSpellSlots(actor, atLeast = 0) {
    return Object.values(actor.system.spells).filter(i => i.value && i.level >= atLeast).length > 0;
}
function getCastableSpells(actor) {
    let maxSlot = Math.max(...Object.values(actor.system.spells).filter(i => i.value).map(j => j.level), 0);
    let validSpells = actor.items.filter(i => i.type === 'spell');
    // If "prepared" mode, keep only prepared
    validSpells = validSpells.filter(i => i.system.method != 'spell' || i.system.level === 0 || i.system.prepared);
    // If limited use, has uses remaining
    validSpells = validSpells.filter(i => !i.system.hasLimitedUses || i.system.uses.value);
    // If no spell slot (and requires), remove
    validSpells = validSpells.filter(i => ['atwill', 'innate'].includes(i.system.method) || maxSlot >= i.system.level);
    // Cast activity shenanigans
    validSpells = validSpells.filter(i => {
        let linkedActivity = i.system.linkedActivity;
        if (!linkedActivity) return true;
        for (let target of linkedActivity.consumption.targets ?? []) {
            if (target.type === 'itemUses') {
                let targetItem;
                if (!target.target?.length) {
                    targetItem = linkedActivity.item;
                } else {
                    targetItem = actor.items.get(target.target);
                }
                if (Number(targetItem?.system.uses.value ?? 0) < Number(target.value ?? 0)) return false;
            } else if (target.type === 'activityUses') {
                if (Number(linkedActivity.uses.value ?? 0) < Number(target.value ?? 0)) return false;
            } else if (target.type === 'material') {
                if (Number(actor.items.get(target.target)?.system.quantity ?? 0) < Number(target.value ?? 0)) return false;
            }
            return true;
        }
    });
    return validSpells;
}
function isShapeChanger(actor) {
    // TODO: what's the best we can do here?
    let changeShape = actor.items.getName(genericUtils.translate('CHRISPREMADES.CommonFeatures.ChangeShape'));
    let shapechanger = actor.items.getName(genericUtils.translate('CHRISPREMADES.CommonFeatures.Shapechanger'));
    let subtype = actor.system.details.type?.subtype?.toLowerCase()?.includes(genericUtils.translate('CHRISPREMADES.CommonFeatures.Shapechanger').toLowerCase());
    return changeShape || shapechanger || subtype;
}
async function doConcentrationCheck(actor, saveDC) {
    await MidiQOL.doConcentrationCheck(actor, saveDC);
}
async function polymorph(origActor, newActor, options, renderSheet=true) {
    let hasPermission = socketUtils.hasPermission(origActor, game.user.id);
    hasPermission = hasPermission && socketUtils.hasPermission(newActor, game.user.id);
    if (hasPermission) {
        return await origActor.transformInto(newActor, options, {renderSheet});
    } else {
        let tokenUuids = await socket.executeAsGM(sockets.polymorph.name, origActor.uuid, newActor.uuid, options, renderSheet);
        return Promise.all(tokenUuids.map(async i => await fromUuid(i)));
    }
}
async function updateAll(actor) {
    let summary = await ActorMedkit.actorUpdateAll(actor);
    return summary;
}
function getEquivalentSpellSlotName(actor, level, {canCast = false} = {}) {
    if (!canCast) {
        return Object.entries(actor.system.spells)?.find(i => i[1].level == level)?.[0];
    } else {
        return Object.entries(actor.system.spells)?.find(i => i[1].level >= level && i[1].value)?.[0];
    }
}
function getEquippedArmor(actor, types = ['heavy', 'medium', 'light']) {
    return actor.items.find(i => types.includes(i.system.type?.value) && i.system.equipped);
}
function getEquippedShield(actor) {
    return actor.items.find(i => i.system.type?.value === 'shield' && i.system.equipped);
}
function getAllEquippedArmor(actor) {
    return actor.items.find(i => Object.keys(CONFIG.DND5E.armorTypes).includes(i.system.type?.value) && i.system.equipped);
}
async function hasConditionBy(sourceActor, targetActor, statusId) {
    let condition = effectUtils.getEffectByStatusID(targetActor, statusId);
    if (!condition) return false;
    let validKeys = ['macro.CE', 'macro.CUB', 'macro.StatusEffect', 'StatusEffect'];
    let hasCondition = await actorUtils.getEffects(targetActor).find(async effect => {
        let originItem = await effectUtils.getOriginItem(effect);
        if (!originItem) return;
        if (originItem?.actor != sourceActor) return;
        if (effect.statuses.has(statusId)) return true;
        if (effect.flags['chris-premades']?.conditions?.includes(statusId)) return true;
        if (effect.changes.find(i => validKeys.includes(i.key) && i.value.toLowerCase() === statusId)) return true;
    });
    return hasCondition ? true : false;
}
function compareSize(source, target, goal) {
    if (!source || !target || !goal) return undefined;
    function findSize(obj) {
        if (obj instanceof foundry.canvas.placeables.Token) return getSize(obj.actor);
        if (obj instanceof Actor) return getSize(obj);
        return Object.entries(CONFIG.DND5E.actorSizes).find(([key, value]) => [key, value.label, value.numerical].includes(obj))[1].numerical;
    }
    let sourceSize = findSize(source);
    let targetSize = findSize(target);
    switch (goal) {
        case 'equal':
        case '=':
        case '===':
            return sourceSize === targetSize;
        case 'greaterThan':
        case '>':
            return sourceSize > targetSize;
        case 'greaterThanOrEqualTo':
        case '>=':
            return sourceSize >= targetSize;
        case 'lessThan':
        case '<':
            return sourceSize < targetSize;
        case 'lessThanOrEqualTo':
        case '<=':
            return sourceSize <= targetSize;
        default:
            return undefined;
    }
}
function getBestAbility(actor, abilities) {
    return abilities.reduce((best, key) => {
        if (!actor.system.abilities[key]) return best;
        return actor.system.abilities[key].mod > actor.system.abilities[best].mod ? key : best;
    });
}
export let actorUtils = {
    getEffects,
    addFavorites,
    removeFavorites,
    getFirstToken,
    getLevelOrCR,
    checkTrait,
    typeOrRace,
    getAlignment,
    getCRFromProf,
    getSidebarActor,
    getTokens,
    getSize,
    hasUsedReaction,
    setReactionUsed,
    removeReactionUsed,
    hasUsedBonusAction,
    setBonusActionUsed,
    removeBonusActionUsed,
    hasSpellSlots,
    getCastableSpells,
    isShapeChanger,
    doConcentrationCheck,
    polymorph,
    updateAll,
    getEquivalentSpellSlotName,
    getEquippedArmor,
    getEquippedShield,
    getAllEquippedArmor,
    hasConditionBy,
    compareSize,
    getBestAbility
};
