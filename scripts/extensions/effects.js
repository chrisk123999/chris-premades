import {activityUtils, actorUtils, constants, effectUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../utils.js';
function activityDC(effect, updates, options, id) {
    if (game.user.id != id || effect.transfer || !(effect.parent instanceof Actor) || !effect.origin) return;
    if (!updates.changes?.length) return;
    let origin = fromUuidSync(effect?.origin, {strict: false});
    if (!origin) return;
    if (!(origin instanceof Item)) {
        if (origin.parent instanceof Item) {
            origin = origin.parent;
        } else {
            origin = fromUuidSync(origin.origin);
            if (!(origin instanceof Item)) return;
        }
    }
    let changed = false;
    updates.changes.forEach(i => {
        if (i.key != 'flags.midi-qol.OverTime') return;
        if (i.value.includes('$activity.dc')) {
            changed = true;
            i.value = i.value.replaceAll('$activity.dc', itemUtils.getSaveDC(origin));
        }
    });
    if (!changed) return;
    effect.updateSource({changes: updates.changes});
}
function noAnimation(...args) {
    if (!args[0].flags['chris-premades']?.effect?.noAnimation) return;
    switch (this.hook) {
        case 'preCreateActiveEffect': args[2].animate = false; break;
        case 'preDeleteActiveEffect': args[1].animate = false; break;
    }
}
async function checkInterdependentDeps(effect) {
    let chrisFlags = effect.flags?.['chris-premades'];
    if (!chrisFlags?.interdependent) return;
    async function check(interdependentUuid) {
        let interdependentEntity = await fromUuid(interdependentUuid);
        if (!interdependentEntity) return;
        let currDependents = interdependentEntity.getDependents();
        if (!currDependents.length) await genericUtils.remove(interdependentEntity);
    }
    let parentEntityUuid = chrisFlags.parentEntityUuid;
    let concentrationEffectUuid = chrisFlags.concentrationEffectUuid;
    if (parentEntityUuid) await check(parentEntityUuid);
    if (concentrationEffectUuid) await check(concentrationEffectUuid);
}
function preCreateActiveEffect(effect, updates, options, id) {
    if (game.user.id != id) return;
    if (updates.description) return;
    let type = genericUtils.getCPRSetting('effectDescriptions');
    let npc = genericUtils.getCPRSetting('effectDescriptionNPC');
    let description;
    if (effect.parent && effect.transfer) {
        if (effect.parent?.documentName !== 'Item') return;
        if (npc && parent.actor?.type === 'npc') return;
        if (effect.parent?.flags?.['chris-premades']?.effectInterface) return;
        description = (effect.parent.system.identified ?? true) ? effect.parent.system.description[type] : effect.parent.system.unidentified.description;
    } else if (!effect.transfer && effect.parent) {
        let origin;
        if (effect.origin) {
            origin = fromUuidSync(updates.origin, {strict: false});
        } else {
            origin = effect.parent;
        }
        if (!origin) return;
        if (origin?.documentName !== 'Item') return;
        if (npc && origin.actor?.type === 'npc') return;
        if (origin?.flags?.['chris-premades']?.effectInterface) return;
        description = (origin.system.identified ?? true) ? origin.system.description[type] : origin.system.unidentified.description;
    } else return;
    effect.updateSource({description: description});
}
// Wizardry to ensure nothing screwy happens when multiple effects are deleted/added in quick sequence
const combinedDebounce = (callback, delay) => {
    let combined = [];
    let debounced = foundry.utils.debounce(() => {
        callback(combined);
        combined = [];
    }, delay);
    return (newArr) => {
        combined = combined.concat(newArr);
        debounced(combined);
    };
};
const unhideDebounce = combinedDebounce((unhideFlagsArr) => {
    let favorites = {};
    for (let unhideFlags of unhideFlagsArr) {
        let {itemUuid, activityIdentifiers} = unhideFlags;
        let item = fromUuidSync(itemUuid);
        if (!item) return;
        let cprRiders = genericUtils.getProperty(item, 'flags.chris-premades.hiddenActivities');
        if (!cprRiders) return;
        cprRiders = new Set(cprRiders);
        activityIdentifiers = new Set(activityIdentifiers);
        let newCprRiders = Array.from(cprRiders.difference(activityIdentifiers));
        itemUtils.setHiddenActivities(item, newCprRiders);
        let actorUuid = item.actor.uuid;
        if (unhideFlags.favorite) favorites[actorUuid] = (favorites[actorUuid] ?? new Set([])).union(activityIdentifiers.map(i => activityUtils.getActivityByIdentifier(item, i)).filter(i => i));
    }
    for (let [uuid, faves] of Object.entries(favorites)) {
        actorUtils.addFavorites(fromUuidSync(uuid), Array.from(faves), 'activity');
    }
}, 200);
const rehideDebounce = combinedDebounce((unhideFlagsArr) => {
    let favorites = [];
    for (let unhideFlags of unhideFlagsArr) {
        let {itemUuid, activityIdentifiers} = unhideFlags;
        let item = fromUuidSync(itemUuid);
        if (!item) return;
        let cprRiders = genericUtils.getProperty(item, 'flags.chris-premades.hiddenActivities');
        if (!cprRiders) return;
        cprRiders = new Set(cprRiders);
        activityIdentifiers = new Set(activityIdentifiers);
        let newCprRiders = Array.from(cprRiders.union(activityIdentifiers));
        itemUtils.setHiddenActivities(item, newCprRiders);
        let actorUuid = item.actor.uuid;
        if (unhideFlags.favorite) favorites[actorUuid] = (favorites[actorUuid] ?? new Set([])).union(activityIdentifiers.map(i => activityUtils.getActivityByIdentifier(item, i)).filter(i => i));
    }
    for (let [uuid, faves] of Object.entries(favorites)) {
        actorUtils.removeFavorites(fromUuidSync(uuid), Array.from(faves), 'activity');
    }
}, 200);
function unhideActivities(effect) {
    let unhideFlagsArr = effect.flags?.['chris-premades']?.unhideActivities;
    if (!unhideFlagsArr) return;
    if (!unhideFlagsArr.length) unhideFlagsArr = [unhideFlagsArr];
    unhideDebounce(unhideFlagsArr);
}
function rehideActivities(effect) {
    let unhideFlagsArr = effect.flags?.['chris-premades']?.unhideActivities;
    if (!unhideFlagsArr) return;
    if (!unhideFlagsArr.length) unhideFlagsArr = [unhideFlagsArr];
    rehideDebounce(unhideFlagsArr);
}
async function specialDuration(workflow) {
    if (!workflow.token) return;
    await Promise.all(workflow.targets.map(async token => {
        if (!token.actor) return;
        await Promise.all(actorUtils.getEffects(token.actor).map(async effect => {
            let specialDurations = effect.flags['chris-premades']?.specialDuration;
            if (!specialDurations) return;
            let remove = false;
            outerLoop:
            for (let i of specialDurations) {
                switch (i) {
                    case 'damagedByAlly':
                        if (workflow.token.document.disposition === token.document.disposition && workflow.hitTargets.has(token) && workflow.damageRolls?.length) remove = true; break outerLoop;
                    case 'damagedByEnemy':
                        if (workflow.token.document.disposition != token.document.disposition && workflow.hitTargets.has(token) && workflow.damageRolls?.length) remove = true; break outerLoop;
                    case 'hitByAnotherCreature':
                        if (!workflow.hitTargets.size) break;
                    // eslint-disable-next-line no-fallthrough
                    case 'attackedByAnotherCreature': {
                        if (!workflow.activity) return;
                        if (!workflowUtils.isAttackType(workflow, 'attack')) break;
                        let origin = await effectUtils.getOriginItem(effect);
                        if (!origin?.actor) break;
                        if (workflow.actor.id === origin.actor.id) break;
                        remove = true;
                        break outerLoop;
                    }
                    case 'hitBySource':
                        if (!workflow.hitTargets.size) break;
                    // eslint-disable-next-line no-fallthrough
                    case 'attackedBySource': {
                        if (!workflow.activity) return;
                        if (!workflowUtils.isAttackType(workflow, 'attack')) break;
                        let origin = await effectUtils.getOriginItem(effect);
                        if (!origin?.actor) break;
                        if (workflow.actor.id != origin.actor.id) break;
                        remove = true;
                        break outerLoop;
                    }
                    case 'endOfWorkflow': {
                        remove = true;
                        break outerLoop;
                    }
                }
            }
            if (remove) await genericUtils.remove(effect);
        }));
    }));
    await Promise.all(actorUtils.getEffects(workflow.actor).map(async effect => {
        let specialDurations = effect.flags['chris-premades']?.specialDuration;
        if (!specialDurations) return;
        let remove = false;
        outerLoop:
        for (let i of specialDurations) {
            switch (i) {
                case 'forceSave': {
                    if (!workflow.activity) return;
                    if (!workflow.activity.hasSave) return;
                    if (workflow.targets.size === 1 && workflow.targets.has(workflow.token)) return;
                    remove = true;
                    break outerLoop;
                }
                case 'endOfWorkflow': {
                    remove = true;
                    break outerLoop;
                }
            }
        }
        if (remove) await genericUtils.remove(effect);
    }));
}
async function specialDurationConditions(effect) {
    let statusEffectIds = CONFIG.statusEffects.map(i => i.id);
    await Promise.all(actorUtils.getEffects(effect.parent).filter(i => i.id != effect.id).map(async eff => {
        let specialDurations = eff.flags['chris-premades']?.specialDuration;
        if (!specialDurations) return;
        specialDurations.filter(j => statusEffectIds.includes(j));
        if (!specialDurations.length) return;
        if (effect.statuses.some(k => specialDurations.includes(k))) await genericUtils.remove(eff);
    }));
}
async function specialDurationEquipment(item) {
    let equipmentTypes = Object.keys(CONFIG.DND5E.armorTypes);
    await Promise.all(actorUtils.getEffects(item.actor).map(async effect => {
        let specialDurations = effect.flags['chris-premades']?.specialDuration;
        if (!specialDurations) return;
        specialDurations.filter(j => equipmentTypes.includes(j));
        if (!specialDurations.length) return;
        if (specialDurations.includes(item.system.type?.value)) await genericUtils.remove(effect);
    }));
}
async function specialDurationHitPoints(actor, updates, options, id) {
    if (game.user.id != socketUtils.gmID()) return;
    let validTypes = [];
    if (updates.system?.attributes?.hp?.temp === 0) validTypes.push('tempHP');
    if (updates.system?.attributes?.hp?.tempmax === 0) validTypes.push('tempMaxHP');
    if (!validTypes.length) return;
    await Promise.all(actorUtils.getEffects(actor).map(async effect => {
        let specialDurations = effect.flags['chris-premades']?.specialDuration;
        if (!specialDurations) return;
        if (specialDurations.find(i => validTypes.includes(i))) await genericUtils.remove(effect);
    }));
}
async function specialDurationMove(actor) {
    let effects = actorUtils.getEffects(actor, {includeItemEffects: true}).filter(i => i.flags['chris-premades']?.specialDuration?.includes('moveFinished'));
    if (!effects.length) return;
    await genericUtils.deleteEmbeddedDocuments(actor, 'ActiveEffect', effects.map(i => i.id));
}
function preImageCreate(effect, updates, options, id) {
    if (game.user.id != id) return;
    if (!(effect.parent instanceof Actor)) return;
    let actorImg = effect.flags['chris-premades']?.image?.actor?.value;
    let tokenImg = effect.flags['chris-premades']?.image?.token?.value;
    let otherActorEffects = actorUtils.getEffects(effect.parent).filter(i => i.flags['chris-premades']?.image?.actor && i.id != effect.id).sort((a, b) => b.flags['chris-premades'].image.actor.priority - a.flags['chris-premades'].image.actor.priority);
    let otherTokenEffects = actorUtils.getEffects(effect.parent).filter(i => i.flags['chris-premades']?.image?.token && i.id != effect.id).sort((a, b) => b.flags['chris-premades'].image.token.priority - a.flags['chris-premades'].image.token.priority);
    if (actorImg && !otherActorEffects.length) {
        effect.updateSource({'flags.chris-premades.image.actor.original': effect.parent.img});
    } else if (actorImg) {
        effect.updateSource({'flags.chris-premades.image.actor.original': otherActorEffects[0].flags['chris-premades'].image.actor.original});
    }
    if (tokenImg && !otherTokenEffects.length) {
        effect.updateSource({'flags.chris-premades.image.token.original': effect.parent.img});
    } else if (tokenImg) {
        effect.updateSource({'flags.chris-premades.image.token.original': otherTokenEffects[0].flags['chris-premades'].image.token.original});
    }
}
async function imageCreate(effect, options, id) {
    if (!socketUtils.isTheGM()) return;
    if (!(effect.parent instanceof Actor)) return;
    let actorImg = effect.flags['chris-premades']?.image?.actor?.value;
    let tokenImg = effect.flags['chris-premades']?.image?.token?.value;
    if (actorImg) {
        let otherActorEffects = actorUtils.getEffects(effect.parent).filter(i => i.flags['chris-premades']?.image?.actor&& i.id != effect.id).sort((a, b) => b.flags['chris-premades'].image.actor.priority - a.flags['chris-premades'].image.actor.priority);
        if (!otherActorEffects.length) {
            await genericUtils.update(effect.parent, {img: actorImg});
        } else if (otherActorEffects[0]?.id != effect.id) {
            await genericUtils.update(effect.parent, {img: otherActorEffects[0].flags['chris-premades'].image.actor.value});
        }
    }
    if (tokenImg) {
        let otherTokenEffects = actorUtils.getEffects(effect.parent).filter(i => i.flags['chris-premades']?.image?.token&& i.id != effect.id).sort((a, b) => b.flags['chris-premades'].image.token.priority - a.flags['chris-premades'].image.token.priority);
        if (!otherTokenEffects.length) {
            let tokens = effect.parent.getActiveTokens();
            if (tokens.length) await Promise.all(tokens.map(async token => await genericUtils.update(token.document, {'texture.src': tokenImg})));
        } else if (otherTokenEffects[0]?.id === effect.id) {
            let tokens = effect.parent.getActiveTokens();
            if (tokens.length) await Promise.all(tokens.map(async token => await genericUtils.update(token.document, {'texture.src': otherTokenEffects[0].flags['chris-premades'].image.token.value})));
        }
    }
}
async function imageRemove(effect, options, id) {
    if (!socketUtils.isTheGM()) return;
    if (!(effect.parent instanceof Actor)) return;
    let actorImg = effect.flags['chris-premades']?.image?.actor?.value;
    let tokenImg = effect.flags['chris-premades']?.image?.token?.value;
    let otherActorEffects = actorUtils.getEffects(effect.parent).filter(i => i.flags['chris-premades']?.image?.actor && i.id != effect.id).sort((a, b) => b.flags['chris-premades'].image.actor.priority - a.flags['chris-premades'].image.actor.priority);
    let otherTokenEffects = actorUtils.getEffects(effect.parent).filter(i => i.flags['chris-premades']?.image?.token && i.id != effect.id).sort((a, b) => b.flags['chris-premades'].image.token.priority - a.flags['chris-premades'].image.token.priority);
    if (actorImg && !otherActorEffects.length) {
        await genericUtils.update(effect.parent, {img: effect.flags['chris-premades'].image.actor.original});
    } else if (actorImg && otherActorEffects[0].id != effect.id) {
        await genericUtils.update(effect.parent, {img: otherActorEffects[0].flags['chris-premades'].image.actor.value});
    }
    if (tokenImg && !otherTokenEffects.length) {
        let tokens = effect.parent.getActiveTokens();
        if (tokens.length) await Promise.all(tokens.map(async token => await genericUtils.update(token.document, {'texture.src': effect.flags['chris-premades'].image.token.original})));
    } else if (tokenImg && otherTokenEffects[0].id != effect.id) {
        let tokens = effect.parent.getActiveTokens();
        if (tokens.length) await Promise.all(tokens.map(async token => await genericUtils.update(token.document, {'texture.src': otherTokenEffects[0].flags['chris-premades'].image.token.value})));
    }
}
async function specialDurationToolCheck(rolls, data) {
    await Promise.all(actorUtils.getEffects(data.subject).map(async effect => {
        let specialDurations = effect.flags['chris-premades']?.specialDuration;
        if (!specialDurations) return;
        let remove = false;
        if (specialDurations.includes(data.tool)) remove = true;
        let target = rolls[0].options.target;
        if (!remove && target) {
            if (target > rolls[0].total && specialDurations.includes(data.tool + 'Fail')) remove = true;
            if (!remove && target <= rolls[0].total && specialDurations.includes(data.tool + 'Succeed')) remove = true;
        }
        if (remove) await genericUtils.remove(effect);
    }));
}
async function removeWorkflowEffects(workflow) {
    let removeEntityUuids = workflow['chris-premades']?.removeEntityUuids;
    if (!removeEntityUuids) return;
    for (let uuid of removeEntityUuids) {
        let entity = await fromUuid(uuid);
        if (!entity) continue;
        await genericUtils.remove(entity);
    }
}
export let effects = {
    noAnimation,
    checkInterdependentDeps,
    preCreateActiveEffect,
    unhideActivities,
    rehideActivities,
    specialDuration,
    specialDurationConditions,
    specialDurationEquipment,
    activityDC,
    preImageCreate,
    imageCreate,
    imageRemove,
    specialDurationHitPoints,
    specialDurationToolCheck,
    removeWorkflowEffects,
    specialDurationMove
};