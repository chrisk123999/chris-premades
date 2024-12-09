import {actorUtils, effectUtils, genericUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    let actor = workflow.targets.first()?.actor ?? workflow.actor;
    if (actorUtils.getSize(actor) > 2) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.actor.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'system.abilities.str.value',
                mode: 4,
                value: 25,
                priority: 20
            },
            {
                key: 'system.attributes.hp.tempmax',
                mode: 5,
                value: actor.system.attributes.hp.max,
                priority: 21
            },
            {
                key: 'flags.midi-qol.range.mwak',
                mode: 2,
                value: 5,
                priority: 20
            },
            {
                key: 'flags.midi-qol.range.msak',
                mode: 2,
                value: 5,
                priority: 20
            },
            {
                key: 'system.traits.size',
                mode: 5,
                value: 'huge',
                priority: 20
            }
        ]
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['potionOfGiantSize']);
    effectUtils.addMacro(effectData, 'effect', ['potionOfGiantSize']);
    await effectUtils.createEffect(actor, effectData, {identifier: 'potionOfGiantSize'});
    await genericUtils.update(actor, {'system.attributes.hp.value': actor.system.attributes.hp.value * 2});
}
async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (workflow.item.type !== 'weapon') return;
    let numWeaponDamageRolls = workflow.activity.damage.parts.length;
    let newRolls = [];
    for (let i = 0; i < numWeaponDamageRolls; i++) {
        let currRoll = workflow.damageRolls[i];
        let newFormula = '';
        for (let j = 0; j < currRoll.terms.length; j++) {
            let currTerm = currRoll.terms[j];
            if (currTerm.isDeterministic) {
                newFormula += currTerm.formula;
                continue;
            }
            newFormula += currTerm.formula.replace(/^(.+?)d(\d)/, '(3*($1))d$2');
        }
        newRolls.push(await new CONFIG.Dice.DamageRoll(newFormula, currRoll.data, currRoll.options).evaluate());
    }
    let newDamageRolls = workflow.damageRolls;
    for (let i = 0; i < numWeaponDamageRolls; i++) {
        newDamageRolls[i] = newRolls[i];
    }
    await workflow.setDamageRolls(newDamageRolls);
}
async function end({trigger: {entity: effect}}) {
    let currHP = effect.parent.system.attributes.hp.value;
    let maxHP = effect.parent.system.attributes.hp.max;
    let diff = currHP - maxHP;
    if (diff <= 0) return;
    await genericUtils.update(effect.parent, {
        'system.attributes.hp': {
            value: maxHP,
            temp: diff
        }
    });
}
export let potionOfGiantSize = {
    name: 'Potion of Giant Size',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 10
            }
        ]
    },
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};