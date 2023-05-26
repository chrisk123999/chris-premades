import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function early(workflow) {
    if (workflow.targets.size === 0) return;
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
        'changes': changes,
        'transfer': true
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
    if (workflow.targets.size === 0) return;
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
    let oldDamageRoll = workflow.damageRoll;
    let newDamageRoll = '';
    for (let i = 0; oldDamageRoll.terms.length > i; i++) {
        let flavor = oldDamageRoll.terms[i].flavor;
        let isDeterministic = oldDamageRoll.terms[i].isDeterministic;
        if (!values.includes(flavor.toLowerCase()) || isDeterministic === true) {
            newDamageRoll += oldDamageRoll.terms[i].formula;
        } else {
            newDamageRoll += '{' + oldDamageRoll.terms[i].expression + ', ' + (oldDamageRoll.terms[i].results.length * 2) + '}kh[' + flavor + ']'
        }
    }
    let damageRoll = await new Roll(newDamageRoll).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
export let elementalAdept = {
    'early': early,
    'late': late,
    'damage': damage
}