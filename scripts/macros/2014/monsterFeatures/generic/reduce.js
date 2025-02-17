import {constants, effectUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'reduce');
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.ability.check.str',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.disadvantage.ability.save.str',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                enlargeReduce: {
                    selection: 'reduce',
                    playAnimation: config.playAnimation
                },
                effect: {
                    sizeAnimation: false
                }
            }
        }
    };
    if (config.oneDamage) {
        effectUtils.addMacro(effectData, 'midi.actor', ['reduceReduced']);
    } else {
        effectData.changes.push(
            {
                key: 'system.bonuses.mwak.damage',
                mode: 2,
                value: '-1d4',
                priority: 20
            },
            {
                key: 'system.bonuses.rwak.damage',
                mode: 2,
                value: '-1d4',
                proirity: 20
            }
        );
    }
    if (config.attackDisadvantage) {
        effectData.changes.push({
            key: 'flags.midi-qol.disadvantage.attack.str',
            mode: 5,
            value: 1,
            priority: 20
        });
    }
    if (config.stealthACBonus) {
        effectData.changes.push(
            {
                key: 'system.skills.ste.bonuses.check',
                mode: 2,
                value: 5,
                priority: 20
            },
            {
                key: 'system.attributes.ac.bonus',
                mode: 2,
                value: 5,
                priority: 20
            }
        );
    }
    effectUtils.addMacro(effectData, 'effect', ['enlargeReduceChanged']);
    let targetSize = workflow.actor.system.traits.size;
    let newSize = targetSize;
    switch (targetSize) {
        case 'sm':
            newSize = 'tiny';
            break;
        case 'med':
            newSize = 'sm';
            break;
        case 'lg':
            newSize = 'med';
            break;
        case 'huge':
            newSize = 'lg';
            break;
        case 'grg':
            newSize = 'huge';
            break;
    }
    if (config.alwaysTiny) newSize = 'tiny';
    effectData.flags['chris-premades'].enlargeReduce.origSize = targetSize;
    effectData.flags['chris-premades'].enlargeReduce.newSize = newSize;
    await effectUtils.createEffect(workflow.actor, effectData);
}
async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1 || !constants.weaponAttacks.includes(workflow.activity.actionType)) return;
    let isFin = workflow.item.system.properties.has('fin');
    if (isFin) {
        if (workflow.actor.system.abilities.str.value < workflow.actor.system.abilities.dex.value) return;
    }
    let numWeaponDamageRolls = workflow.activity.damage.parts.length;
    let newWeaponDamageRoll = await new CONFIG.Dice.DamageRoll('1', {}, workflow.damageRolls[0].options).evaluate();
    let damageRolls = [newWeaponDamageRoll].concat(workflow.damageRolls.slice(numWeaponDamageRolls));
    await workflow.setDamageRolls(damageRolls);
}
export let reduce = {
    name: 'Reduce',
    translation: 'CHRISPREMADES.Macros.Reduce.Name',
    version: '1.1.16',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true
        },
        {
            value: 'oneDamage',
            label: 'CHRISPREMADES.Macros.Reduce.OneDamage',
            type: 'checkbox',
            default: true
        },
        {
            value: 'attackDisadvantage',
            label: 'CHRISPREMADES.Macros.Reduce.AttackDisadvantage',
            type: 'checkbox',
            default: true
        },
        {
            value: 'alwaysTiny',
            label: 'CHRISPREMADES.Macros.Reduce.AlwaysTiny',
            type: 'checkbox',
            default: true
        },
        {
            value: 'stealthACBonus',
            label: 'CHRISPREMADES.Macros.Reduce.StealthACBonus',
            type: 'checkbox',
            default: true
        }
    ]
};
export let reduceReduced = {
    name: 'Reduce: Reduced',
    version: reduce.version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};