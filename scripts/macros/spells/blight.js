import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'blight', 50);
    if (!queueSetup) return;
    let creatureType = chris.raceOrType(workflow.targets.first().actor);
    let newDamageRoll = '';
    if (creatureType === 'plant') {
        let oldDamageRoll = workflow.damageRoll;
        for (let i = 0; oldDamageRoll.terms.length > i; i++) {
            let flavor = oldDamageRoll.terms[i].flavor;
            let isDeterministic = oldDamageRoll.terms[i].isDeterministic;
            if (isDeterministic === true) {
                newDamageRoll += oldDamageRoll.terms[i].formula;
            } else {
                newDamageRoll += '(' + oldDamageRoll.terms[i].number + '*' + oldDamageRoll.terms[i].faces + ')[' + flavor + ']';
            }
        }
    } else if (creatureType === 'undead' || creatureType === 'construct') {
        let defaultDamageType = workflow.damageRolls[0].terms[0].flavor;
        newDamageRoll = '0[' + defaultDamageType + ']';
    } else {
        queue.remove(workflow.item.uuid);
        return;
    }
    let damageRoll = await new Roll(newDamageRoll).roll({'async': true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function early({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let creatureType = chris.raceOrType(workflow.targets.first().actor);
    if (creatureType != 'plant') return;
    let effectData = {
        'label': 'Condition Disadvantage',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'duration': {
            'turns': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.disadvantage.ability.save.all',
                'value': '1',
                'mode': 5,
                'priority': 120
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'isSave'
                ]
            }
        }
    };
    await chris.createEffect(workflow.targets.first().actor, effectData);
}
export let blight = {
    'early': early,
    'damage': damage
}