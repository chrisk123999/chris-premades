import {actorUtils, applications, automationUtils, compendiumUtils, constants, documentUtils, effectUtils, genericUtils, itemUtils, Logging, tokenUtils, uiUtils, workflowUtils} from '../../../../../proxy.mjs';
import {default as cpr} from '../../../../../constants.mjs';
function log(source, identifier, msg, notify) {
    Logging.addMacroWarning(source, identifier, msg, {notify});
    return true;
}
async function preCheck({actor, macroClass: {identifier, source}}) {
    if (!actor.flags[source]?.raging)
        return log(source, identifier, 'CHRISPREMADES.Macros.Modern.BranchesOfTheTree.Rage', true);
}
async function burningHands({document: activity, macroClass: {identifier, source}, token}) {
    const effect = activity.item.effects.find(e => documentUtils.getIdentifier(e) === 'burningHands')?.toObject();
    if (!effect) return log(source, identifier, `"Spells" Burning Hands exited early due to a missing effect. (item) ${activity.item.uuid} (identifier) burningHands`);
    let strike = actorUtils.getItemByIdentifier(activity.actor, 'unarmed-strike', {type: 'weapon'});
    if (!strike) {
        const pack = documentUtils.getRules(activity.item) === '2024' ? cpr.packs.modern.misc : cpr.packs.legacy.misc;
        strike = await compendiumUtils.getDocumentByIdentifier(pack, 'unarmed-strike');
    }
    if (!strike) return log(source, identifier, `"Spells" Burning Hands exited early without locating an unarmed strike item. (actor) ${activity.actor.uuid}`);
    const attack = itemUtils.getActivityByIdentifier(strike, 'unarmed-strike');
    if (!attack) return log(source, identifier, `"Spells" Burning Hands exited early without locating the unarmed strike attack activity. (item) ${strike.uuid} (identifier) unarmed-strike`);
    const near = tokenUtils.findNearby(token, attack.range.value || 5);
    if (!near.length) return log(source, identifier, 'CHRISPREMADES.Macros.Legacy.HuntersMark.NoTargets', true);
    const config = automationUtils.getConfigValues(activity.item, ['damage', 'damageType']);
    const burning = attack.toObject();
    burning.damage.parts = [{custom: {enabled: true, formula: config.damage}, types: [config.damageType]}];
    burning.target.affects = {count: near.length, type: 'creature'};
    burning.midiProperties.identifier = 'burningHands';
    burning.activation.type = 'special';
    burning.damage.includeBase = false;
    burning.target.override = true;
    burning.name = activity.name;
    burning.img = activity.img;
    const item = strike.toObject();
    item.system.activities[burning._id] = burning;
    const roll = await workflowUtils.syntheticItemDataRoll(item, activity.actor, near, {options: {activityIdentifier: burning.midiProperties.identifier}});
    if (!roll?.hitTargets.size) return log(source, identifier, '"Spells" Burning Hands exited early with no hit targets.');
    await Promise.all(roll.hitTargets.map(t => effectUtils.createEffects(t.actor, [effect])));
}
async function magicMissile({document: activity, macroClass: {identifier, source}, workflow}) {
    const config = automationUtils.getConfigValues(activity.item, Object.keys(spells.config));
    const weapons = activity.actor.itemTypes.weapon.filter(w => {
        if (!w.system.quantity) return false; // thrown weapons reduce quantity
        if (config.weapons.length && config.weapons.includes(w.system.type.baseItem)) return true;
        if (config.attackAbility.length && !config.attackAbility.includes(w.system.abilityMod)) return false;
        if (config.properties.length && !config.properties.some(p => w.system.properties.has(p))) return false;
        return true;
    });
    if (!weapons.length) {
        workflow.aborted = true; // refunds
        return log(source, identifier, 'CHRISPREMADES.Macros.Legacy.DedicatedWeapon.NoValid', true);
    }
    const inputs = await Promise.all(weapons.map(async w => ({
        label: w.name,
        name: w.id,
        options: {
            tooltip: await uiUtils.enrichHTML(w.system.description.value, w.getRollData()),
            maxAmount: Math.min(config.attacks, w.system.quantity),
            image: w.img,
            minAmount: 0,
            tags: [
                {label: w.labels.range, id: 'range'},
                {label: `${_loc('DND5E.QuantityAbbr')} ${w.system.quantity}`, id: 'quantity', tooltip: `${_loc('DND5E.Quantity')} ${w.system.quantity}`},
                ...w.labels.damages.map((d, i) => ([
                    {label: d.formula, id: 'damage-' + i, tooltip: d.formula},
                    {label: CONFIG.DND5E.damageTypes[d.damageType]?.label ?? d.damageType, id: 'type-' + i, image: CONFIG.DND5E.damageTypes[d.damageType]?.icon}
                ])).flat()
            ]
        }
    })));
    const choices = await applications.DialogApp.dialog(
        `${activity.item.name}: ${activity.name}`,
        'CHRISPREMADES.Macros.Modern.Spells.MagicMissile',
        [['selectAmount', inputs, {displayAsRows: true, totalMax: config.attacks}]],
        'okCancel',
        {width: 400}
    );
    if (!choices?.buttons) return log(source, identifier, `"Spells" Magic Missile exited early due to a declined weapon choice prompt. (actor) ${activity.actor.uuid}`);
    delete choices.buttons;
    const message = genericUtils.notify('', {progress: true});
    let count = 1;
    const total = Object.values(choices).reduce((t, each) => t += Number(each), 0);
    for (const [id, amount] of Object.entries(choices)) {
        if (!count || amount === '0') continue;
        const weapon = weapons.find(w => w.id === id);
        const attack = weapon?.system.activities.getByType('attack')[0]?.toObject();
        if (!attack) {
            log(source, identifier, `"Spells" Magic Missile skipped attack ${count} of ${total}, could not find an attack activity. (weapon) ${weapon?.uuid}`);
            continue;
        }
        attack.activation.type = 'special';
        for (let i = 0; i < amount; i++) {
            message.update({pct: (count - 1) / config.attacks, message: _loc('CHRISPREMADES.Macros.Modern.Spells.MagicMissileNote', {
                weapon: weapon.name,
                num: count,
                total
            })});
            await workflowUtils.syntheticActivityDataRoll(attack, weapon, [], {options: {
                workflowOptions: {attackMode: 'thrown', targetConfirmation: 'always'},
                advantage: true
            }});
            count++;
        }
    }
    message.update({pct: 1});
}
async function shieldHit({document: activity, macroClass: {identifier, source}, workflow}) {
    const effect = activity.item.effects.find(e => documentUtils.getIdentifier(e) === 'spellsShield')?.toObject();
    if (!effect) return log(source, identifier, `"Spells" Shield exited early due to a missing effect. (item) ${activity.item.uuid} (identifier) spellsShield`);
    const bonus = activity.actor.itemTypes.equipment.reduce((bonus, item) => {
        if (item.system.type.value !== 'shield') return bonus;
        return Math.max(bonus, item.system.armor.value);
    }, 0);
    if (!bonus) return log(source, identifier, `"Spells" Shield exited early without any shields available. (actor) ${activity.actor.uuid}`);
    genericUtils.setProperty(effect.system, 'changes.0.value', bonus);
    genericUtils.setProperty(effect, `flags.${source}.spellsShieldReduction`, workflow.utilityRoll?.total);
    await effectUtils.createEffects(activity.actor, [effect]);
}
async function shieldDamaged({document: effect, ditem, macroClass: {identifier, source}, workflow}) {
    documentUtils.deleteDocument(effect);
    if (!ditem.isHit || ditem.totalDamage === 0) return;
    const amount = effect.flags[source]?.spellsShieldReduction;
    if (!amount) return log(source, identifier, `"Spells" Shield failed to roll damage reduction. (actor) ${ditem.actorUuid} (amount) ${amount}`);
    workflowUtils.modifyDamageAppliedFlat(ditem, -amount);
}
export const spells = {
    name: '"Spells"',
    version: '2.1.3',
    rules: '2024',
    config: {
        damage: {
            default: '1d8 + @mod',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Modern.Spells.BurningHandsDamage',
            category: 'behavior'
        },
        damageType: {
            default: 'bludgeoning',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.Spells.BurningHandsType',
            get options() { return constants.damageTypeOptions; }
        },
        attacks: {
            default: 3,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.Spells.MagicMissileAttacks'
        },
        weapons: {
            default: ['dagger', 'dart'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.Spells.MagicMissileWeapons',
            hint: 'CHRISPREMADES.Macros.Modern.Spells.MagicMissileHint',
            get options() { return constants.weaponOptions; }
        },
        properties: {
            default: ['thr'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.Spells.MagicMissileWeaponProps',
            get options() { return constants.itemProperties; }
        },
        attackAbility: {
            default: ['str'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.Spells.MagicMissileAttackAbility',
            get options() { return constants.abilityOptions; }
        }
    }
};
export const spellsBurningHands = {
    version: spells.version,
    rules: spells.rules,
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: preCheck,
            priority: 50
        },
        {
            pass: 'activityPreambleComplete',
            macro: burningHands,
            priority: 50
        }
    ]
};
export const spellsMagicMissile = {
    version: spells.version,
    rules: spells.rules,
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: preCheck,
            priority: 50
        },
        {
            pass: 'activityPreambleComplete',
            macro: magicMissile,
            priority: 50
        }
    ]
};
export const spellsShield = {
    version: spells.version,
    rules: spells.rules,
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: preCheck,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: shieldHit,
            priority: 50
        }
    ]
};
export const spellsShieldDamaged = {
    version: spells.version,
    rules: spells.rules,
    roll: [
        {
            pass: 'targetDamageFlatReductions',
            macro: shieldDamaged,
            priority: 300
        }
    ]
};
