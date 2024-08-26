import { genericUtils } from '../utils.js';
function updateSummonInitiative(actor, [combatant]) {
    if (!actor || !combatant) return;
    let summons = combatant.parent.combatants.contents.filter(i => i.actorId != actor.id)?.filter(i => i.actor.flags['chris-premades']?.summons?.control?.actor === actor?.uuid);
    if (!summons?.length) return;
    summons.forEach(c => combatantLoop(c, combatant));
}
function updateCompanionInitiative(actor, [combatant]) {
    if (!actor || !combatant) return;
    let actorOwnerUserIds = [];
    for (let [key, value] of Object.entries(actor.ownership)) {
        if (key === 'default' && value === 3) return;
        if (key === 'default') continue;
        if (value === 3 && game.users.get(key).isGM === false) actorOwnerUserIds.push(key);
    }
    if (!actorOwnerUserIds) return;
    let companions = combatant.parent.combatants.contents.filter(c => (c.actorId != actor.id) && (Object.entries(c.actor.ownership).find(([key, value]) => (actorOwnerUserIds.includes(key) && value === 3))));
    if (!companions?.length) return;
    companions.forEach(c => combatantLoop(c, combatant));
}
function combatantLoop(c, combatant) {
    if (c.initiative === null) {
        if (game.user.isGM) c.update({'initiative': combatant.initiative - 0.01});
        else updateInitiative(c, combatant.initiative - 0.01);
    }
}
function updateInitiative(combatant, initiative) {
    genericUtils.update(combatant, {initiative: initiative});
}
export let initiative = {
    updateCompanionInitiative: updateCompanionInitiative,
    updateSummonInitiative: updateSummonInitiative
};