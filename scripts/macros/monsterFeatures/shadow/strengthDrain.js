import {chris} from '../../../helperFunctions.js';
export async function strengthDrain({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.isFumble) return;
    let roll = await new Roll('1d4').roll({'async': true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {'alias': name},
        flavor: workflow.item.name
    });
    let damage = -roll.total;
    let targetActor = workflow.targets.first().actor;
    let effect = chris.findEffect(targetActor, workflow.item.name);
    if (!effect) {
        let effectData = {
            'label': workflow.item.name,
            'icon': workflow.item.img,
            'duration': {
                'seconds': 604800
            },
            'changes': [
                {
                    'key': 'system.abilities.str.value',
                    'mode': 2,
                    'value': damage,
                    'priority': 20
                }
            ],
            'flags': {
                'dae': {
                    'transfer': false,
                    'specialDuration': [
                        'shortRest'
                    ],
                    'stackable': 'multi',
                    'macroRepeat': 'none'
                }
            }
        };
        await chris.createEffect(targetActor, effectData);
    } else {
        let oldDamage = parseInt(effect.changes[0].value);
        damage += oldDamage;
        let updates = {
            'changes': [
                {
                    'key': 'system.abilities.str.value',
                    'mode': 2,
                    'value': damage,
                    'priority': 20
                }
            ]
        };
        await chris.updateEffect(effect, updates);
    }
    if (targetActor.system.abilities.str.value <= 0) {
        let unconscious = chris.findEffect(targetActor, 'Unconscious');
        if (unconscious) await chris.removeCondition(targetActor, 'Unconscious');
        await chris.addCondition(targetActor, 'Dead', true, null)
    }
}