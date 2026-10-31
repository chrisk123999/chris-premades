import {itemUtils} from '../../../proxy.mjs';
import constants from '../../../constants.mjs';
import {addImpact, addShake, elementColors, partOption, pickFile} from './spellParts.mjs';
const meleeFiles = {
    battleaxe: ['jb2a.handaxe.melee.standard.white'],
    club: ['jb2a.club.melee.01.white'],
    dagger: ['jb2a.dagger.melee.02.white'],
    falchion: ['jb2a.falchion.melee.01.white'],
    flail: ['jb2a.mace.melee.01.white'],
    glaive: ['jb2a.glaive.melee.01.white'],
    greataxe: ['jb2a.greataxe.melee.standard.white'],
    greatclub: ['jb2a.maul.melee.standard.white'],
    greatsword: ['jb2a.greatsword.melee.standard.white'],
    halberd: ['jb2a.halberd.melee.01.white'],
    handaxe: ['jb2a.handaxe.melee.standard.white'],
    javelin: ['jb2a.spear.melee.01.white'],
    lance: ['jb2a.spear.melee.01.white'],
    lighthammer: ['jb2a.hammer.melee.01.white'],
    longsword: ['jb2a.sword.melee.01.white'],
    mace: ['jb2a.mace.melee.01.white'],
    maul: ['jb2a.maul.melee.standard.white'],
    morningstar: ['jb2a.mace.melee.01.white'],
    pike: ['jb2a.spear.melee.01.white'],
    quarterstaff: ['jb2a.quarterstaff.melee.01.white'],
    rapier: ['jb2a.rapier.melee.01.white'],
    scimitar: ['jb2a.scimitar.melee.01.white'],
    shortsword: ['jb2a.shortsword.melee.01.white'],
    sickle: ['jb2a.scimitar.melee.01.white'],
    spear: ['jb2a.spear.melee.01.white'],
    trident: ['jb2a.spear.melee.01.white'],
    warhammer: ['jb2a.warhammer.melee.01.white'],
    warpick: ['jb2a.warhammer.melee.01.white'],
    whip: ['jb2a.melee_generic.slash.01.orange'],
    unarmed: ['jb2a.unarmed_strike.physical.01.blue'],
    natural: ['jb2a.claws.400px.red', 'jb2a.melee_generic.creature_attack.claw.001.red'],
    generic: ['jb2a.melee_generic.slash.01.orange']
};
const meleeFallbacks = {
    bludgeoning: 'mace',
    piercing: 'spear',
    slashing: 'longsword'
};
const projectileFiles = {
    arrow: ['jb2a.arrow.physical.white.01'],
    crossbowBolt: ['jb2a.bolt.physical.white', 'jb2a.bolt.physical.orange'],
    firearmBullet: ['jb2a.bullet.01.orange'],
    flameJet: ['jb2a.breath_weapons.fire.line.orange', 'jb2a.fire_bolt.orange'],
    slingBullet: ['jb2a.slingshot', 'jb2a.bullet.02.orange'],
    blowgunNeedle: ['jb2a.dart.01.throw.physical.white', 'jb2a.dagger.throw.01.white'],
    dart: ['jb2a.dart.01.throw.physical.white', 'jb2a.dagger.throw.01.white'],
    dagger: ['jb2a.dagger.throw.01.white'],
    handaxe: ['jb2a.handaxe.throw.01', 'jb2a.dagger.throw.01.white'],
    lighthammer: ['jb2a.hammer.throw', 'jb2a.dagger.throw.01.white'],
    warhammer: ['jb2a.hammer.throw', 'jb2a.dagger.throw.01.white'],
    javelin: ['jb2a.javelin.01.throw', 'jb2a.dagger.throw.01.white'],
    spear: ['jb2a.javelin.01.throw', 'jb2a.dagger.throw.01.white'],
    trident: ['jb2a.javelin.01.throw', 'jb2a.dagger.throw.01.white'],
    boulder: ['jb2a.boulder.toss.02.01.stone.brown']
};
const baseItemAmmunition = {
    longbow: 'arrow',
    shortbow: 'arrow',
    handcrossbow: 'crossbowBolt',
    heavycrossbow: 'crossbowBolt',
    lightcrossbow: 'crossbowBolt',
    sling: 'slingBullet',
    blowgun: 'blowgunNeedle',
    musket: 'firearmBullet',
    pistol: 'firearmBullet',
    ...Object.fromEntries(Object.keys(constants.firearmBaseItems).map(key => [key, 'firearmBullet']))
};
const tints = {
    blue: '#5aa9ff',
    dark_purple: '#6b2fa3',
    green: '#4fd65a',
    orange: '#ff8a1f',
    pink: '#ff6ad5',
    purple: '#a66bff',
    yellow: '#ffe45c'
};
function meleeOptions() {
    const weapons = Object.keys(CONFIG.DND5E.weaponIds).filter(key => !baseItemAmmunition[key]);
    return {
        auto: {label: 'CHRISPREMADES.Animations.WeaponAttack.Styles.Auto'},
        ...Object.fromEntries(weapons.map(key => [key, {label: itemUtils.getBaseWeaponLabel(key) ?? key}])),
        unarmed: {label: CONFIG.DND5E.weaponTypes.unarmed},
        natural: {label: CONFIG.DND5E.weaponTypes.natural},
        generic: {label: 'CHRISPREMADES.Animations.WeaponAttack.Generic'}
    };
}
function projectileOptions() {
    const thrown = Object.keys(CONFIG.DND5E.weaponIds).filter(key => projectileFiles[key]);
    return {
        auto: {label: 'CHRISPREMADES.Animations.WeaponAttack.Styles.Auto'},
        ...Object.fromEntries(Object.entries(CONFIG.DND5E.consumableTypes.ammo.subtypes).map(([key, label]) => [key, {label}])),
        ...Object.fromEntries(thrown.map(key => [key, {label: itemUtils.getBaseWeaponLabel(key) ?? key}])),
        boulder: {label: 'CHRISPREMADES.Animations.WeaponAttack.Boulder'},
        flameJet: {label: 'CHRISPREMADES.Animations.WeaponAttack.FlameJet'}
    };
}
function getStyle(style, item, activity, attackMode) {
    if (style !== 'auto') return style;
    if ((item?.system.properties?.has('fir') || baseItemAmmunition[item?.system.type?.baseItem] === 'firearmBullet') && activity?.attack?.type?.value !== 'melee') return 'firearm';
    if (attackMode?.startsWith('thrown')) return 'thrown';
    return activity?.attack?.type?.value === 'ranged' ? 'ranged' : 'melee';
}
function getMeleeFiles(weapon, item, damageType = item?.system.damage?.base?.types?.first?.()) {
    const type = item?.system.type;
    let key = weapon;
    if (key === 'auto') {
        if (type?.value === 'natural') key = 'natural';
        else if (type?.value === 'unarmed' || item?.system.identifier?.includes('unarmed')) key = 'unarmed';
        else key = type?.baseItem;
    }
    return meleeFiles[key] ?? meleeFiles[meleeFallbacks[damageType]] ?? meleeFiles.generic;
}
function getProjectileFiles(projectile, item, ammunition, style) {
    const key = projectile !== 'auto' ? projectile : ammunition?.system.type?.subtype ?? baseItemAmmunition[item?.system.type?.baseItem] ?? item?.system.type?.baseItem;
    if (projectileFiles[key]) return projectileFiles[key];
    return CONFIG.DND5E.consumableTypes.ammo.subtypes[key] || style === 'firearm' ? projectileFiles.firearmBullet : projectileFiles.dagger;
}
async function play(sourceToken, targetToken, {style = 'auto', weapon = 'auto', projectile = 'auto', tint = true, impact = true, shake = true, sound, item, activity, ammunition, attackMode, damageType, hit, misfire} = {}) {
    if (!sourceToken || !targetToken) return;
    const resolvedStyle = getStyle(style, item, activity, attackMode);
    const landed = hit !== false;
    const color = elementColors[damageType];
    const tintColor = tint ? tints[color] : undefined;
    const sequence = new Sequence();
    if (sound) sequence.sound().file(sound);
    if (resolvedStyle === 'firearm' && misfire) {
        sequence.effect().file(pickFile('jb2a.smoke.puff.side.grey', 'jb2a.smoke.puff.centered.grey')).atLocation(sourceToken).rotateTowards(targetToken).scaleToObject(1.5).zIndex(3);
        await sequence.play();
        return;
    }
    if (resolvedStyle === 'firearm') sequence.effect().file(pickFile('jb2a.muzzle_flash.single.01.yellow')).atLocation(sourceToken).rotateTowards(targetToken).scaleToObject(1).spriteOffset({x: 0.5}, {gridUnits: true}).zIndex(3);
    const file = resolvedStyle === 'melee' ? pickFile(...getMeleeFiles(weapon, item, damageType), ...meleeFiles.generic) : pickFile(...getProjectileFiles(projectile, item, resolvedStyle === 'thrown' ? undefined : ammunition, resolvedStyle), ...projectileFiles.dagger);
    const section = sequence.effect().file(file).atLocation(sourceToken).stretchTo(targetToken).missed(!landed).zIndex(2);
    if (tintColor) section.tint(tintColor);
    section.waitUntilFinished(resolvedStyle === 'melee' ? -800 : -400);
    if (impact && color && !['bludgeoning', 'piercing', 'slashing'].includes(damageType)) addImpact(sequence, targetToken, color, {scale: 0.8, playIf: landed});
    if (resolvedStyle === 'firearm' && item?.system.properties?.has('explosive')) sequence.effect().file(pickFile('jb2a.explosion.01.orange')).atLocation(targetToken).scaleToObject(2.5).zIndex(3).playIf(landed);
    addShake(sequence, targetToken, {duration: 500, playIf: shake && landed});
    await sequence.play();
}
export const weaponAttack = {
    name: 'CHRISPREMADES.Animations.WeaponAttack.Name',
    macros: {
        play
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'generic',
    get config() {
        return {
            style: {
                default: 'auto',
                type: 'select',
                label: 'CHRISPREMADES.Animations.SpellParts.Style',
                hint: 'CHRISPREMADES.Animations.WeaponAttack.StyleHint',
                options: Object.fromEntries(['auto', 'melee', 'thrown', 'ranged', 'firearm'].map(key => [key, {label: 'CHRISPREMADES.Animations.WeaponAttack.Styles.' + key.capitalize()}]))
            },
            weapon: {
                default: 'auto',
                type: 'select',
                label: 'CHRISPREMADES.Config.Weapon',
                hint: 'CHRISPREMADES.Animations.WeaponAttack.WeaponHint',
                options: meleeOptions()
            },
            projectile: {
                default: 'auto',
                type: 'select',
                label: 'CHRISPREMADES.Animations.WeaponAttack.Projectile',
                hint: 'CHRISPREMADES.Animations.WeaponAttack.ProjectileHint',
                options: projectileOptions()
            },
            tint: partOption('Tint', {hint: 'CHRISPREMADES.Animations.WeaponAttack.TintHint'}),
            impact: partOption('Impact', {hint: 'CHRISPREMADES.Animations.WeaponAttack.ImpactHint'}),
            shake: partOption('Shake'),
            sound: {
                label: 'CHRISPREMADES.Config.Sound',
                hint: 'CHRISPREMADES.Animations.WeaponAttack.SoundHint',
                type: 'file',
                fileType: 'audio',
                default: ''
            }
        };
    }
};
