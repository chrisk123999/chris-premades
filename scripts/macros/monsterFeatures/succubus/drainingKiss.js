import {chris} from '../../../helperFunctions.js';
export async function drainingKiss({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetActor = workflow.targets.first().actor;
    let damage = -workflow.damageList[0].appliedDamage;
    if (damage === 0) return;
    let targetMaxHP = targetActor.system.attributes.hp.max;
    let effect = chris.findEffect(targetActor, workflow.item.name);
    if (!effect) {
        let effectData = {
            'label': workflow.item.name,
            'icon': workflow.item.img,
            'duration': {
                'seconds': 604800
            },
            'origin': workflow.item.uuid,
            'changes': [
                {
                    'key': 'system.attributes.hp.tempmax',
                    'mode': 2,
                    'value': Math.max(damage, -targetMaxHP),
                    'priority': 20
                }
            ],
            'flags': {
                'dae': {
                    'specialDuration': [
                        'longRest'
                    ]
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
                    'key': 'system.attributes.hp.tempmax',
                    'mode': 2,
                    'value': Math.max(damage, -targetMaxHP),
                    'priority': 20
                }
            ]
        };
        await chris.updateEffect(effect, updates);
    }
    if (Math.abs(damage) >= targetMaxHP) {
        let unconscious = chris.findEffect(targetActor, 'Unconscious');
        if (!unconscious) return;
        await chris.removeCondition(targetActor, 'Unconscious');
        await chris.addCondition(targetActor, 'Dead', true, null)
    }
}