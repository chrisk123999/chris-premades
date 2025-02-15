import { genericUtils } from '../utils.js';
function updateSummonInitiative(actor, [combatant]) {
    if (!actor || !combatant || (actor.type != 'character')) return;
    let summons = combatant.parent.combatants.contents.filter(i => (i.actor.type != 'character') && (i.actorId != actor.id))?.filter(i => i.actor.flags['chris-premades']?.summons?.control?.actor === actor?.uuid);
    if (!summons?.length) return;
    summons.forEach(c => combatantLoop(c, combatant));
}
function updateCompanionInitiative(actor, [combatant]) {
    if (!actor || !combatant || (actor.type != 'character')) return;
    let actorOwnerUserIds = [];
    for (let [key, value] of Object.entries(actor.ownership)) {
        if (key === 'default' && value === 3) return;
        if (key === 'default') continue;
        if (value === 3 && game.users.get(key).isGM === false) actorOwnerUserIds.push(key);
    }
    if (!actorOwnerUserIds) return;
    let companions = combatant.parent.combatants.contents.filter(c => (c.actor.type != 'character') && (c.actorId != actor.id) && (Object.entries(c.actor.ownership).find(([key, value]) => (actorOwnerUserIds.includes(key) && value === 3))));
    if (!companions?.length) return;
    companions.forEach(c => combatantLoop(c, combatant));
}
function combatantLoop(c, combatant) {
    if (c.initiative === null) genericUtils.update(combatant, {initiative: initiative});
}
function patchedGetGroupingKey(wrapped, ...args) {
    let result = wrapped(args);
    let controlActorUuid = this.actor.flags['chris-premades']?.summons?.control?.actor;
    if (!result || controlActorUuid) {
        let actor = controlActorUuid ? (fromUuidSync(controlActorUuid) ?? this.actor) : this.actor;
        result = (Math.round(this.initiative)).paddedString(4) + ':' + this?.token?.disposition + ':' + actor.id;
    }
    return result;    
}
function patch(enabled) {
    if (enabled) {
        libWrapper.register('chris-premades', 'CONFIG.Combatant.documentClass.prototype.getGroupingKey', patchedGetGroupingKey, 'MIXED');
    } else {
        libWrapper.unregister('chris-premades', 'CONFIG.Combatant.documentClass.prototype.getGroupingKey');
    }
}
export let initiative = {
    updateCompanionInitiative,
    updateSummonInitiative,
    patch
};