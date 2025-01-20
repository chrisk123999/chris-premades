import {activityUtils, actorUtils, genericUtils, itemUtils} from '../utils.js';
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
                }
            }
            if (remove) await genericUtils.remove(effect);
        }));
    }));
}
export let effects = {
    noAnimation,
    checkInterdependentDeps,
    preCreateActiveEffect,
    unhideActivities,
    rehideActivities,
    specialDuration
};