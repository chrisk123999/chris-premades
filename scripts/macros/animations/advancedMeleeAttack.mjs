import {animationUtils} from '../../proxy.mjs';
const groupedWeapons = {
    'melee_attack.01': ['butterflysword', 'chakram', 'magic_sword', 'shortsword', 'sickle'],
    'melee_attack.02': ['battleaxe', 'bone', 'hammer', 'handaxe', 'mace', 'warhammer', 'wrench', 'pan'],
    'melee_attack.03': ['greatbone', 'greataxe', 'greatclub', 'greatsword', 'khybersword', 'magical_greatsword'],
    'melee_attack.04': ['falchion', 'katana', 'scimitar'],
    'melee_attack.05': ['scythe', 'nodachi'],
    'melee_attack.06': ['shield']
};
const trailColors = {
    '01': ['blueyellow', 'orangered', 'pinkpurple'],
    '02': ['blueyellow', 'orangered', 'pinkpurple'],
    '03': ['blueyellow', 'orangered', 'pinkpurple'],
    '04': ['blue', 'dark_purple', 'dark_red']
};
const trailColorMap = {
    none: 'None',
    blueyellow: 'BlueYellow',
    orangered: 'OrangeRed',
    pinkpurple: 'PinkPurple',
    blue: 'Blue',
    dark_purple: 'DarkPurple',
    dark_red: 'DarkRed'
};
function toPascalCase(str) {
    let words = str.split('_');
    let result = [];
    for (let i = 0; i < words.length; i++) result.push(words[i].charAt(0).toUpperCase() + words[i].slice(1));
    return result.join('');
}
const magic_sword = ['yellow', 'dark_green', 'dark_purple', 'blue', 'orange'];
const magical_greatsword = ['orange', 'dark_green', 'dark_purple', 'blue'];
const weaponMap = Object.create(null);
Object.entries(groupedWeapons).forEach(([groupName, weapons]) => weapons.forEach(w => weaponMap[w] = groupName));
function getGroup(name) {
    return weaponMap[name];
}
const configWeaponMap = Object.create(null);
Object.entries(groupedWeapons).forEach(([groupName, weapons]) => {
    weapons.forEach(weapon => {
        const baseSuffix = toPascalCase(weapon);
        const hasVariants = ['magic_sword', 'magical_greatsword', 'chakram', 'shield'].includes(weapon);
        if (!hasVariants) configWeaponMap[weapon] = baseSuffix;
        if (weapon === 'magic_sword') {
            const colors = ['yellow', 'dark_green', 'dark_purple', 'blue', 'orange', 'random'];
            for (let i = 0; i < colors.length; i++) configWeaponMap[weapon + '.' + colors[i]] = baseSuffix + '.' + toPascalCase(colors[i]);
        } else if (weapon === 'magical_greatsword') {
            const colors = ['orange', 'dark_green', 'dark_purple', 'blue', 'random'];
            for (let i = 0; i < colors.length; i++) configWeaponMap[weapon + '.' + colors[i]] = baseSuffix + '.' + toPascalCase(colors[i]);
        } else if (weapon === 'chakram') {
            const styles = ['01', '02', '03', '04'];
            for (let i = 0; i < styles.length; i++) configWeaponMap[weapon + '.' + styles[i]] = baseSuffix + '.Style' + styles[i];
        } else if (weapon === 'shield') {
            const styles = ['01', '02', '04'];
            for (let i = 0; i < styles.length; i++) configWeaponMap[weapon + '.' + styles[i]] = baseSuffix + '.Style' + styles[i];
        }
    });
});
async function attack(sourceToken, targetTokens, {soundMelee, soundRanged, enableSwitchDistance, enableReturn, enableBlood, enableShake, weapon, trailColor, impact, impactScale = 1.5, soundDelay, switchDistance, attackDelay}) {
    const weaponParts = weapon.split('.');
    const baseWeapon = weaponParts[0];
    let weaponOption = weaponParts[1];
    if (weaponOption === 'random') {
        if (baseWeapon === 'magic_sword') {
            weaponOption = magic_sword[Math.floor(Math.random() * magic_sword.length)];
        } else if (baseWeapon === 'magical_greatsword') {
            weaponOption = magical_greatsword[Math.floor(Math.random() * magical_greatsword.length)];
        }
    }
    const weaponGroup = getGroup(baseWeapon);
    let dbPath = 'jb2a.' + weaponGroup + '.' + baseWeapon;
    if (weaponOption) dbPath = dbPath + '.' + weaponOption;
    const entries = Sequencer.Database.getEntry(dbPath);
    const entriesLength = entries.length;
    let enableTrail = trailColor !== 'none';
    let calculatedTrailColor = trailColor;
    let calculatedTrail = '01';
    if (enableTrail) {
        let availableTrails = [];
        if (calculatedTrailColor && calculatedTrailColor !== 'random') {
            for (let t in trailColors) {
                if (trailColors[t].includes(calculatedTrailColor)) {
                    availableTrails.push(t);
                }
            }
        }
        if (availableTrails.length === 0) {
            let allTrailColors = [];
            for (let t in trailColors) {
                for (let i = 0; i < trailColors[t].length; i++) {
                    if (!allTrailColors.includes(trailColors[t][i])) {
                        allTrailColors.push(trailColors[t][i]);
                    }
                }
            }
            calculatedTrailColor = allTrailColors[Math.floor(Math.random() * allTrailColors.length)];
            for (let t in trailColors) {
                if (trailColors[t].includes(calculatedTrailColor)) {
                    availableTrails.push(t);
                }
            }
        }
        if (availableTrails.length > 0) calculatedTrail = availableTrails[Math.floor(Math.random() * availableTrails.length)];
    }
    if (weaponGroup === 'melee_attack.06') enableTrail = false;
    let calculatedReturnFile;
    if (enableReturn) {
        if (baseWeapon === 'bone') {
            calculatedReturnFile = 'jb2a.bone.return.01';
        } else if (baseWeapon === 'chakram') {
            let chakramStyle = weaponOption ? weaponOption : '01';
            calculatedReturnFile = 'jb2a.chakram.' + chakramStyle + '.return.01';
        } else if (baseWeapon === 'greatsword') {
            calculatedReturnFile = 'jb2a.greatsword.return';
        } else if (baseWeapon === 'hammer') {
            calculatedReturnFile = 'jb2a.hammer.return';
        } else if (baseWeapon === 'shield') {
            let shieldStyle = weaponOption ? weaponOption : '01';
            calculatedReturnFile = 'jb2a.shield_attack.ranged.return.' + shieldStyle + '.white.01';
        } else {
            enableReturn = false; 
        }
    }
    let calculatedThrowFile;
    if (baseWeapon === 'bone') {
        calculatedThrowFile = 'jb2a.bone.throw.01';
    } else if (baseWeapon === 'chakram') {
        const chakramStyle = weaponOption ? weaponOption : '01';
        calculatedThrowFile = 'jb2a.chakram.01.throw.' + chakramStyle;
    } else if (baseWeapon === 'greataxe') {
        calculatedThrowFile = 'jb2a.greataxe.throw.white';
    } else if (baseWeapon === 'greatsword') {
        calculatedThrowFile = 'jb2a.greatsword.throw';
    } else if (baseWeapon === 'hammer') {
        calculatedThrowFile = 'jb2a.hammer.throw';
    } else if (baseWeapon === 'handaxe') {
        calculatedThrowFile = 'jb2a.handaxe.throw.01';
    } else if (baseWeapon === 'mace') {
        calculatedThrowFile = 'jb2a.mace.throw';
    } else if (baseWeapon === 'shield') {
        const shieldStyle = weaponOption ? weaponOption : '01';
        calculatedThrowFile = 'jb2a.shield_attack.ranged.throw.' + shieldStyle + '.white.01';
    } else if (baseWeapon === 'shortsword') {
        calculatedThrowFile = 'jb2a.sword.throw.white';
    } else {
        calculatedThrowFile = 'jb2a.dagger.throw.01.white';
    }
    const gridSize = sourceToken.parent.gride.size;
    async function meleeAttack(targetToken, randMelee, randTrail, impact, isMirrored, targetScale) {
        const amplitude = Sequencer.Helpers.random_float_between(0.0, 0.2);
        const hitRay = new Ray(sourceToken, targetToken);
        const shakeDirection = {x: Math.sign(hitRay.dx), y: Math.sign(hitRay.dy)};
        const values = {
            x: [0, -amplitude * shakeDirection.y, amplitude * shakeDirection.y, (-amplitude * shakeDirection.y) / 4, (amplitude * shakeDirection.y) / 4, 0],
            y: [0, amplitude * shakeDirection.x, -amplitude * shakeDirection.x, (amplitude * shakeDirection.x) / 4, (-amplitude * shakeDirection.x) / 4, 0]
        };
        const interval = 50;
        const easeOption = 'easeInOutSine';
        /* eslint-disable indent */
        new Sequence()
            .effect()
                .file(randTrail)
                .atLocation(targetToken)
                .rotateTowards(sourceToken)
                .rotate(180)
                .animateProperty('sprite', 'position.x', { from: -(2.5 * gridSize + hitRay.distance), to: -2.5 * gridSize, duration: 500 + hitRay.distance, ease: 'easeOutQuint'})
                .scale(0.5)
                .mirrorY(isMirrored)
                .zIndex(11)
                .playIf(enableTrail)
            .effect()
                .file(randMelee)
                .atLocation(targetToken)
                .rotateTowards(sourceToken)
                .rotate(180)
                .animateProperty('sprite', 'position.x', {from: -(2.5 * gridSize + hitRay.distance), to: -2.5 * gridSize, duration: 500 + hitRay.distance, ease: 'easeOutQuint'})
                .scale(0.5)
                .mirrorY(isMirrored)
                .zIndex(10)
                .waitUntilFinished(-1000)
            .animation()
                .on(sourceToken)
            .sound()
                .file(soundMelee)
                .playIf(soundMelee)
            .effect()
                .file(impact)
                .atLocation(targetToken)
                .scaleToObject(impactScale, {uniform: true})
                .zIndex(12)
                .playIf(impact)
            .effect()   // Blood
                .file('jb2a.liquid.splash_side.red')
                .atLocation(targetToken)
                .rotateTowards(sourceToken)
                .randomRotation()
                .scaleToObject(1.5, {uniform: true})
                .playIf(enableBlood)
                .zIndex(12)
            .animation()    //Shake
                .on(targetToken)
                .fadeOut(50)
                .playIf(enableShake)
            .effect()
                .from(targetToken)
                .loopProperty('spriteContainer', 'position.x', {
                    values: values.x,
                    duration: interval - ((interval * amplitude) / 2),
                    gridUnits: true,
                    ease: easeOption
                })
                .loopProperty('spriteContainer', 'position.y', {
                    values: values.y,
                    duration: interval - ((interval * amplitude) / 2),
                    gridUnits: true,
                    ease: easeOption
                })
                .scale({x: targetScale.x, y: targetScale.y})
                .duration(interval * 9)
                .playIf(enableShake)
                .zIndex(1)
                .waitUntilFinished(-150)
            .animation()
                .on(targetToken)
                .fadeIn(50)
                .playIf(enableShake)
            .play();
        /* eslint-enable indent */
    }
    async function rangedAttack(targetToken, targetScale) {
        const amplitude = Sequencer.Helpers.random_float_between(0.0, 0.2);
        const hitRay = new Ray(sourceToken, targetToken);
        const shakeDirection = {x: Math.sign(hitRay.dx), y: Math.sign(hitRay.dy)};
        const values = {
            x: [0, -amplitude * shakeDirection.y, amplitude * shakeDirection.y, (-amplitude * shakeDirection.y) / 4, (amplitude * shakeDirection.y) / 4, 0],
            y: [0, amplitude * shakeDirection.x, -amplitude * shakeDirection.x, (amplitude * shakeDirection.x) / 4, (-amplitude * shakeDirection.x) / 4, 0]
        };
        const interval = 50;
        const easeOption = 'easeInOutSine';
        /* eslint-disable indent */
        new Sequence()
            .sound()
                .file(soundRanged)
                .playIf(soundRanged)
                .delay(soundDelay)
            .effect()
                .file(calculatedThrowFile)
                .atLocation(sourceToken)
                .stretchTo(targetToken)
                .waitUntilFinished(-800)
                .zIndex(10)
            .effect()
                .file(impact)
                .atLocation(targetToken)
                .scaleToObject(1.2, {uniform: true})
                .zIndex(12)
                .playIf(impact)
            .effect()
                .file(calculatedReturnFile)
                .atLocation(sourceToken)
                .stretchTo(targetToken)
                .zIndex(10)
                .playIf(enableReturn)
            .effect()   //Blood
                .file('jb2a.liquid.splash_side.red')
                .atLocation(targetToken)
                .rotateTowards(sourceToken)
                .randomRotation()
                .scaleToObject(1.5, {uniform: true})
                .zIndex(11)
                .playIf(enableBlood)
            .animation()    //Shake
                .on(targetToken)
                .fadeOut(50)
                .playIf(enableShake)
            .effect()
                .from(targetToken)
                .loopProperty('spriteContainer', 'position.x', {
                    values: values.x,
                    duration: interval - ((interval * amplitude) / 2),
                    gridUnits: true,
                    ease: easeOption
                })
                .loopProperty('spriteContainer', 'position.y', {
                    values: values.y,
                    duration: interval - ((interval * amplitude) / 2),
                    gridUnits: true,
                    ease: easeOption
                })
                .scale({ x: targetScale.x, y: targetScale.y })
                .duration(interval * 9)
                .playIf(enableShake)
                .zIndex(1)
                .waitUntilFinished(-150)
            .animation()
                .on(targetToken)
                .fadeIn(50)
                .playIf(enableShake)
            .play();
        /* eslint-enable indent */
    }
    for (let targetToken of targetTokens) {
        const targetScale = {x: targetToken.texture.scaleX, y: targetToken.texture.scaleY};
        const rand = Math.floor(Math.random() * ((entriesLength - 1) + 1));
        const randMelee = dbPath + '.' + rand;
        const randTrail = enableTrail ? 'jb2a.' + weaponGroup + '.trail.' + calculatedTrail + '.' + calculatedTrailColor + '.' + rand : 'jb2a.antilife_shell.blue_no_circle';
        const isMirrored = Math.random() < 0.5;
        const targetBounds = targetToken.object.bounds.pad(gridSize * (switchDistance / 5 - 1 + 0.5), gridSize * (switchDistance / 5 - 1 + 0.5));
        const sourceBounds = sourceToken.object.bounds;
        const withinSwitchDistance = targetBounds.intersects(sourceBounds);
        if (withinSwitchDistance || !enableSwitchDistance) {
            await meleeAttack(targetToken, randMelee, randTrail, impact, isMirrored, targetScale);
            await Sequencer.Helpers.wait(attackDelay);
        } else {
            await rangedAttack(targetToken, targetScale);
            await Sequencer.Helpers.wait(attackDelay);
        }
    }
}
export const advancedMeleeAttack = {
    name: 'CHRISPREMADES.Animations.AdvancedMeleeAttack.Name',
    macros: {
        attack
    },
    inputs: ['sourceToken', 'targetTokens', 'options'],
    requirements: ['JB2A_DnD5e'],
    type: 'weaponAttacks',
    get config() {
        return {
            weapon: {
                default: 'shortsword',
                type: 'select',
                label: 'CHRISPREMADES.Config.Generic.Weapon',
                options: animationUtils.buildColorOptions(configWeaponMap, {
                    labelPrefix: 'CHRISPREMADES.Config.Weapons.'
                })
            },
            trailColor: {
                default: 'none',
                type: 'select',
                label: 'CHRISPREMADES.Animations.AdvancedMeleeAttack.TrailColor',
                options: animationUtils.buildColorOptions(trailColorMap, {
                    freeColors: ['none'],
                    labelPrefix: 'CHRISPREMADES.Config.Colors.',
                    random: true
                })
            },
            enableSwitchDistance: {
                default: false,
                type: 'checkbox',
                label: 'CHRISPREMADES.Animations.AdvancedMeleeAttack.EnableSwitchDistance'
            },
            enableReturn: {
                default: false,
                type: 'checkbox',
                label: 'CHRISPREMADES.Animations.AdvancedMeleeAttack.EnableReturn'
            },
            enableBlood: {
                default: false,
                type: 'checkbox',
                label: 'CHRISPREMADES.Animations.AdvancedMeleeAttack.EnableBlood'
            },
            enableShake: {
                default: false,
                type: 'checkbox',
                label: 'CHRISPREMADES.Animations.AdvancedMeleeAttack.EnableShake'
            },
            soundMelee: {
                label: 'CHRISPREMADES.Config.Generic.SoundMelee',
                type: 'file',
                fileType: 'audio',
                default: ''
            },
            soundRanged: {
                label: 'CHRISPREMADES.Config.Generic.SoundRanged',
                type: 'file',
                fileType: 'audio',
                default: ''
            },
            soundDelay: {
                default: 300,
                type: 'number',
                label: 'CHRISPREMADES.Config.Generic.SoundDelay'
            },
            impact: {
                label: 'CHRISPREMADES.Animations.AdvancedMeleeAttack.ImpactFile',
                type: 'file',
                fileType: 'image',
                default: ''
            },
            attackDelay: {
                default: 1000,
                type: 'number',
                label: 'CHRISPREMADES.Animations.AdvancedMeleeAttack.AttackDelay'
            }
        };
    },
    credits: [
        {
            name: 'Gazkhan / Jules'
        },
        {
            name: 'Sisimshow'
        }
    ]
};