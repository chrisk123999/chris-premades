import {constants, effectUtils, itemUtils, rollUtils, tokenUtils} from '../../../../utils.js';

async function use({workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'enlarge');
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'flags.midi-qol.advantage.ability.check.str',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.ability.save.str',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                enlargeReduce: {
                    selection: 'enlarge',
                    playAnimation: config.playAnimation
                },
                effect: {
                    sizeAnimation: false
                }
            }
        }
    };
    if (config.doubleDice) {
        effectUtils.addMacro(effectData, 'midi.actor', ['enlargeEnlarged']);
    } else {
        effectData.changes.push(
            {
                key: 'system.bonuses.mwak.damage',
                mode: 2,
                value: '+1d4',
                priority: 20
            },
            {
                key: 'system.bonuses.rwak.damage',
                mode: 2,
                value: '+1d4',
                proirity: 20
            }
        );
    }
    effectUtils.addMacro(effectData, 'effect', ['enlargeReduceChanged']);
    let doGrow = true;
    let targetSize = workflow.actor.system.traits.size;
    if (targetSize !== 'tiny' && targetSize !== 'sm') {
        let room = tokenUtils.checkForRoom(workflow.token, 1);
        let direction = tokenUtils.findDirection(room);
        if (direction === 'none') doGrow = false;
    }
    let newSize = targetSize;
    if (doGrow) {
        switch (targetSize) {
            case 'tiny':
                newSize = 'sm';
                break;
            case 'sm':
                newSize = 'med';
                break;
            case 'med':
                newSize = 'lg';
                break;
            case 'lg':
                newSize = 'huge';
                break;
            case 'huge':
                newSize = 'grg';
                break;
        }
    }
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
    let newWeaponRolls = [];
    for (let i = 0; i < numWeaponDamageRolls; i++) {
        let currRoll = workflow.damageRolls[i];
        let newRoll = await new CONFIG.Dice.DamageRoll(await rollUtils.getCriticalFormula(currRoll.formula, currRoll.data), currRoll.data, currRoll.options).evaluate();
        newWeaponRolls.push(newRoll);
    }
    let damageRolls = newWeaponRolls.concat(workflow.damageRolls.slice(numWeaponDamageRolls));
    await workflow.setDamageRolls(damageRolls);
}
export let enlarge = {
    name: 'Enlarge',
    translation: 'CHRISPREMADES.Macros.Enlarge.Name',
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
            value: 'doubleDice',
            label: 'CHRISPREMADES.Macros.Enlarge.Double',
            type: 'checkbox',
            default: true
        }
    ]
};
export let enlargeEnlarged = {
    name: 'Enlarge: Enlarged',
    version: enlarge.version,
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