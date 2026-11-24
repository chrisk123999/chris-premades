import {actorUtils, automationUtils, constants, DamageBonus, dialogUtils, documentUtils, itemUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function damage({document: item, workflow}) {
    if (!item.system.uses.value || !workflow.hitTargets.count || !workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (!automationUtils.getConfigValue(item, 'weaponTypes').includes(workflow.item.system.type?.value)) return;
    const roll = workflow.damageRolls?.find(roll => roll.dice.length);
    if (!roll) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'orcish-fury');
    if (!activity) return Logging.addMacroWarning('chris-premades', 'orcish-fury-extra-damage', 'Missing the orcish-fury activity.', {notify: 'warn'});
    return new DamageBonus(item, {formula: automationUtils.getConfigValue(item, 'extraDice') + 'd' + roll.dice[0].faces, type: roll.options.type})
        .withOnUse(async () => await workflowUtils.completeActivityUse(activity, []));
}
function weaponRange(weapon) {
    const {value, long, reach} = itemUtils.getRange(weapon);
    const thrown = weapon.system.properties?.has('thr');
    const melee = ['simpleM', 'martialM'].includes(weapon.system.type?.value);
    return Math.max(melee ? (reach || 5) : 0, !melee || thrown ? (long || value || 0) : 0);
}
async function endure({document: item, data: {item: trigger, workflow}}) {
    const actor = item.actor;
    if (!automationUtils.getConfigValue(item, 'triggerIdentifiers').includes(documentUtils.getIdentifier(trigger)) || actorUtils.hasUsedReaction(actor)) return;
    const token = actorUtils.getFirstToken(actor);
    const weapons = actor.items.filter(weapon => weapon.type === 'weapon' && itemUtils.getEquipmentState(weapon) && weapon.system.activities.some(activity => activity.type === 'attack'))
        .map(weapon => ({weapon, range: weaponRange(weapon)}));
    if (!token || !weapons.length) return;
    const maxRange = Math.max(...weapons.map(entry => entry.range));
    const nearby = tokenUtils.findNearby(token, maxRange).filter(other => other.actor && other.disposition !== token.disposition);
    const attacker = workflow?.token?.document;
    const inRange = other => tokenUtils.getDistance(token, other) <= maxRange;
    const victims = Array.from(new Set([attacker && inRange(attacker) ? attacker : undefined, ...nearby].filter(other => other && other !== token)));
    if (!victims.length) return;
    const userId = queryUtils.firstOwner(actor, true);
    if (!await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.Legacy.OrcishFury.Attack', {userId})) return;
    const victim = victims.length > 1 ? (await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.Legacy.OrcishFury.Target', victims, {userId}))?.result : victims[0];
    if (!victim) return;
    const distance = tokenUtils.getDistance(token, victim);
    const usable = weapons.filter(entry => entry.range >= distance).map(entry => entry.weapon);
    const weapon = usable.length > 1 ? await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.Legacy.OrcishFury.Weapon', usable, {userId}) : usable[0];
    if (!weapon) return;
    await actorUtils.setReactionUsed(actor);
    await workflowUtils.completeActivityUse(weapon.system.activities.find(activity => activity.type === 'attack'), [victim], {userId, consumeResources: false});
}
export const orcishFury = {
    name: 'Orcish Fury: Extra Damage',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 250
        }
    ],
    called: [
        {
            pass: 'actorPreventDeath',
            macro: endure,
            priority: 50
        }
    ],
    config: {
        extraDice: {
            default: 1,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.OrcishFury.ExtraDice',
            category: 'homebrew'
        },
        weaponTypes: {
            default: ['simpleM', 'simpleR', 'martialM', 'martialR'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.WeaponTypes',
            category: 'homebrew',
            get options() { return constants.weaponTypes; }
        },
        triggerIdentifiers: {
            default: ['relentless-endurance'],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Config.Identifiers',
            hint: 'CHRISPREMADES.Macros.Legacy.OrcishFury.TriggerIdentifiers.Hint',
            category: 'homebrew'
        }
    }
};
