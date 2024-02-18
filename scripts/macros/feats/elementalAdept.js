import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function early(workflow) {
    if (!workflow.targets.size) return;
    let spellFlag = workflow.item.flags['chris-premades']?.spell;
    if (!(workflow.item.type === 'spell' || spellFlag)) return;
    let values = [];
    if (workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.acid) values.push('acid');
    if (workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.cold) values.push('cold');
    if (workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.fire) values.push('fire');
    if (workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.lightning) values.push('lightning');
    if (workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.thunder) values.push('thunder');
    if (values.length === 0) return;
    let changes = [];
    for (let i of values) {
        changes.push({
            'key': 'system.traits.dv.value',
            'mode': 0,
            'value': i,
            'priority': 20
        });
    }
    let effectData = {
        'label': 'Elemental Adept',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'origin': workflow.actor.uuid,
        'duration': {
            'seconds': 1
        },
        'changes': changes
    }
    workflow.targets.forEach(async function(token, key, set) {
        for (let i of values) {
            if (chris.checkTrait(token.actor, 'dr', i)) {
                await chris.createEffect(token.actor, effectData);
                break;
            }
        }
    });
}
async function late(workflow) {
    if (workflow.targets.size === 0) return;
    workflow.targets.forEach(async function(token, key, set) {
        let effect = chris.findEffect(token.actor, 'Elemental Adept');
        if (effect) await chris.removeEffect(effect);
    });
}
async function damage(workflow) {
    if (!workflow.targets.size) return;
    let spellFlag = workflow.item.flags['chris-premades']?.spell;
    if (!(workflow.item.type === 'spell' || spellFlag)) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'elementalAdept', 320);
    if (!queueSetup) return;
    let values = [];
    if (workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.acid) values.push('acid');
    if (workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.cold) values.push('cold');
    if (workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.fire) values.push('fire');
    if (workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.lightning) values.push('lightning');
    if (workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.thunder) values.push('thunder');
    if (values.length === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await Promise.all(workflow.damageRolls.map(async (damageRoll, i, arr) => {
        if (!values.includes(damageRoll.options.type.toLowerCase())) return;
        let newDamageFormula = '';
        for (let i = 0; damageRoll.terms.length > i; i++) {
            let flavor = damageRoll.terms[i].flavor;
            let isDeterministic = damageRoll.terms[i].isDeterministic;
            if (isDeterministic === true) {
                newDamageFormula += damageRoll.terms[i].formula;
            } else {
                newDamageFormula += damageRoll.terms[i].expression + 'min2[' + flavor + ']'
            }
        }
        arr[i] = await chris.damageRoll(workflow, newDamageFormula, damageRoll.options, true);
    }));
    await workflow.setDamageRolls(workflow.damageRolls);
    queue.remove(workflow.item.uuid);
}
export let elementalAdept = {
    'early': early,
    'late': late,
    'damage': damage
}