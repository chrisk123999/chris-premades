import {animationUtils, automationUtils} from '../../proxy.mjs';
const identifier = 'soundEffects';
function sound(name) {
    return {default: '', type: 'file', sequencer: true, fileType: 'audio', category: 'animations', label: `CHRISPREMADES.Macros.Generic.SoundEffects.${name}.Label`, hint: `CHRISPREMADES.Macros.Generic.SoundEffects.${name}.Hint`};
}
function sounds(document, keys) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', identifier, [...keys, 'soundVolume']);
    if (!keys.some(key => config[key]) || animationUtils.deferredToAABLFX(document)) return;
    return config;
}
function use({document}) {
    const config = sounds(document, ['useSound']);
    if (config) animationUtils.playSound(config.useSound, {volume: config.soundVolume});
}
function attack({document, workflow}) {
    const config = sounds(document, ['attackSound', 'hitSound', 'missSound', 'critSound']);
    if (!config) return;
    animationUtils.playSound(config.attackSound, {volume: config.soundVolume});
    const impact = workflow.isCritical && config.critSound ? config.critSound : workflow.hitTargets.size ? config.hitSound : config.missSound;
    animationUtils.playSound(impact, {volume: config.soundVolume, delay: 400});
}
function damage({document}) {
    const config = sounds(document, ['damageSound']);
    if (config) animationUtils.playSound(config.damageSound, {volume: config.soundVolume});
}
/**
 * Plays chosen sounds when the item is used, when its attack is rolled, when the attack hits, misses or crits, and when
 * its damage is rolled. Sequencer database paths play only while their module is installed.
 */
export const soundEffects = {
    rules: 'all',
    version: '2.1.11',
    category: 'animations',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: use,
            priority: 50
        },
        {
            pass: 'itemAttackRollComplete',
            macro: attack,
            priority: 50
        },
        {
            pass: 'itemDamageRollComplete',
            macro: damage,
            priority: 50
        }
    ],
    genericConfig: {
        useSound: sound('Use'),
        attackSound: sound('Attack'),
        hitSound: sound('Hit'),
        missSound: sound('Miss'),
        critSound: sound('Crit'),
        damageSound: sound('Damage'),
        soundVolume: {
            default: 0.8,
            type: 'number',
            min: 0,
            max: 1,
            step: 0.05,
            category: 'animations',
            label: 'CAT.SoundVolume.Label',
            hint: 'CAT.SoundVolume.Hint'
        }
    }
};
