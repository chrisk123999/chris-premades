import cprConstants from '../../../constants.mjs';
import {actorUtils, compendiumUtils, documentUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../proxy.mjs';
export const actions = {
    'backbreaker': {weapons: ['warhammer', 'maul'], damage: 'die'},
    'brace-melee': {weapons: ['glaive', 'pike']},
    'brace-ranged': {weapons: ['heavycrossbow', 'longbow']},
    'cleave': {weapons: ['battleaxe', 'greataxe', 'halberd', 'greatsword'], damage: 'half'},
    'concussive-smash': {weapons: ['morningstar', 'club', 'lighthammer', 'mace', 'warhammer', 'greatclub', 'maul', 'flail']},
    'disarming-strike': {weapons: ['trident'], damage: 'die'},
    'flourish': {weapons: ['scimitar', 'shortsword', 'rapier'], damage: 'die'},
    'hamstring-shot': {weapons: ['shortbow', 'longbow']},
    'heartstopper': {weapons: ['morningstar'], damage: 'die'},
    'lacerate': {weapons: ['handaxe', 'sickle', 'scimitar', 'battleaxe', 'longsword', 'glaive', 'greataxe', 'greatsword', 'halberd']},
    'maiming-strike': {weapons: ['warpick', 'battleaxe'], damage: 'die'},
    'mobile-shot': {weapons: ['handcrossbow']},
    'piercing-shot': {weapons: ['heavycrossbow', 'lightcrossbow', 'handcrossbow']},
    'piercing-strike': {weapons: ['dagger', 'rapier', 'shortsword', 'trident', 'pike', 'javelin']},
    'pommel-strike': {weapons: ['longsword', 'greatsword'], damage: 'die'},
    'prepare': {weapons: ['greataxe']},
    'rush': {weapons: ['longsword', 'spear', 'trident', 'glaive', 'halberd', 'pike'], damage: 'die'},
    'tenacity': {weapons: ['morningstar', 'greatclub', 'maul', 'flail']},
    'topple': {weapons: ['quarterstaff'], damage: 'die'},
    'weakening-strike': {weapons: ['rapier', 'warpick', 'warhammer', 'flail'], damage: 'die'}
};
const constructOrUndead = actor => ['construct', 'undead'].includes(actorUtils.typeOrRace(actor));
const unaffected = {
    'lacerate': constructOrUndead,
    'piercing-strike': constructOrUndead,
    'piercing-shot': constructOrUndead,
    'maiming-strike': actor => actor.system.attributes.movement.fly > 0,
    'weakening-strike': actor => !actorUtils.getEquippedWeapons(actor).length
};
const getSetting = key => game.settings.get('chris-premades', key);
const actionKey = activity => activity.identifier.replace(/-save$/, '');
const qualifies = (weapon, key) => weapon.system.equipped && weapon.system.prof?.hasProficiency !== false && getSetting('bg3-' + key).includes(weapon.system.type?.baseItem);
function weaponParts(weapon, mode) {
    const base = weapon.system.damage.base;
    const types = Array.from(base.types);
    if (mode === 'die') return [{number: 1, denomination: 4, types: types.length ? types : ['bludgeoning']}];
    const formula = base.formula + ' + @mod' + (weapon.system.magicalBonus ? ' + ' + weapon.system.magicalBonus : '');
    return [{types, custom: {enabled: true, formula: 'floor((' + formula + ') / 2)'}}];
}
async function equipped(weapon, changes, options, userId) {
    if (userId !== game.user.id || weapon.type !== 'weapon' || !weapon.actor || changes.system?.equipped === undefined) return;
    const existing = documentUtils.getEffectByIdentifier(weapon, 'bg3WeaponActions');
    if (existing) await documentUtils.deleteDocument(existing);
    if (!changes.system.equipped || !getSetting('bg3WeaponActions')) return;
    const keys = Object.keys(actions).filter(key => qualifies(weapon, key));
    if (!keys.length) return;
    const sources = await Promise.all(keys.map(key => compendiumUtils.getDocumentByIdentifier(cprConstants.packs.legacy.misc, key, {object: true})));
    const enchantment = await itemUtils.enchantItem(weapon, {
        name: _loc('CHRISPREMADES.Settings.Bg3WeaponActions.Name'),
        img: 'modules/chris-premades/images/bg3/Cleave.webp',
        origin: weapon.uuid,
        system: {magical: false},
        flags: {cat: {identifier: 'bg3WeaponActions'}}
    });
    const dc = weapon.system.activities.getByType('attack')[0]?.ability || 'str';
    const activities = {};
    const effectIds = new Set();
    sources.forEach((data, index) => {
        const damage = actions[keys[index]].damage;
        Object.values(data.system.activities).forEach(activity => {
            if (!activity.flags?.cat?.hidden) {
                activity.name ||= data.name;
                activity.img ||= data.img;
            }
            if (activity.type === 'attack' && damage) activity.damage.parts = weaponParts(weapon, damage);
            if (activity.type === 'save') activity.save.dc.calculation = dc;
            genericUtils.setProperty(activity, 'flags.dnd5e.dependentOn', enchantment.id);
            activities[activity._id] = activity;
            activity.effects.forEach(effect => effectIds.add(effect._id));
        });
    });
    await documentUtils.updateEmbeddedDocuments(weapon.actor, 'Item', [{_id: weapon.id, 'system.activities': activities}]);
    const effects = await documentUtils.createEmbeddedDocuments(weapon, 'ActiveEffect', sources.flatMap(data => data.effects).filter(effect => effectIds.has(effect._id)), {keepId: true});
    await documentUtils.makeDependent(enchantment, effects);
}
async function rest(actor) {
    if (actor.getFlag('chris-premades', 'bg3WeaponActions')) await documentUtils.setFlag(actor, 'chris-premades', 'bg3WeaponActions', 0);
}
function requireWeapon({activity}) {
    if (activity.type === 'save') return;
    if (!getSetting('bg3WeaponActions') || !qualifies(activity.item, actionKey(activity))) {
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.BG3WeaponActions.NoWeapon', {type: 'warn'});
        return true;
    }
    if ((activity.actor.getFlag('chris-premades', 'bg3WeaponActions') ?? 0) < getSetting('bg3WeaponActionUses')) return;
    genericUtils.notify('CHRISPREMADES.Macros.Legacy.BG3WeaponActions.NoUses', {type: 'warn'});
    return true;
}
async function riders({document: activity, workflow}) {
    const key = actionKey(activity);
    if (activity.type !== 'save') {
        await documentUtils.setFlag(workflow.actor, 'chris-premades', 'bg3WeaponActions', (workflow.actor.getFlag('chris-premades', 'bg3WeaponActions') ?? 0) + 1);
        const save = itemUtils.getActivityByIdentifier(activity.item, key + '-save');
        if (save && workflow.hitTargets.size) await workflowUtils.syntheticActivityRoll(save, Array.from(workflow.hitTargets, token => token.document), {consumeUsage: false, consumeResources: false});
        return;
    }
    if (!workflow.failedSaves.size) return;
    const source = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.legacy.misc, key);
    const sourceEffect = documentUtils.getEffectByIdentifier(source, key + '-rider');
    if (!sourceEffect) return;
    const effectData = documentUtils.getEffectData(source, sourceEffect.id);
    const skip = unaffected[key];
    await Promise.all(Array.from(workflow.failedSaves).filter(token => token.actor && !skip?.(token.actor)).map(token => effectUtils.createEffects(token.actor, [effectData])));
}
async function brace({document: effect, workflow}) {
    const ranged = effect.flags['chris-premades']?.brace === 'ranged';
    if (!workflow.damageRolls?.length || !workflowUtils.isAttackType(workflow, ranged ? 'rangedAttack' : 'meleeAttack')) return;
    const rolls = await Promise.all(workflow.damageRolls.map(roll => rollUtils.damageRoll('max((' + roll.formula + '), (' + roll.formula + '))', workflow.activity, roll.options)));
    await workflow.setDamageRolls(rolls);
}
async function gapingWounds({workflow}) {
    if (!workflow.attackRoll || !workflow.damageRolls?.length) return;
    await workflowUtils.bonusDamage(workflow, '2', {ignoreCrit: true, damageType: 'piercing'});
}
export const bg3Hooks = {equipped, rest};
export const bg3WeaponAction = {
    name: 'BG3 Weapon Action',
    version: '2.1.6',
    rules: '2014',
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: requireWeapon,
            priority: 10
        },
        {
            pass: 'activityRollFinished',
            macro: riders,
            priority: 50
        }
    ]
};
export const bg3Brace = {
    name: 'BG3 Weapon Action: Brace',
    version: bg3WeaponAction.version,
    rules: bg3WeaponAction.rules,
    roll: [
        {
            pass: 'actorDamageRoll',
            macro: brace,
            priority: 400
        }
    ]
};
export const bg3GapingWounds = {
    name: 'BG3 Weapon Action: Gaping Wounds',
    version: bg3WeaponAction.version,
    rules: bg3WeaponAction.rules,
    roll: [
        {
            pass: 'targetDamageRollComplete',
            macro: gapingWounds,
            priority: 50
        }
    ]
};
