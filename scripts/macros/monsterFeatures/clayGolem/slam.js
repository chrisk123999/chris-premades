import {chris} from '../../../helperFunctions.js';
export async function slam({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1 || this.failedSaves.size != 1) return;
    let damage = -this.damageList[0].appliedDamage;
    if (damage === 0) return;
    let targetActor = this.targets.first().actor;
    let targetMaxHP = targetActor.system.attributes.hp.max;
    let effectName = targetActor.name + ' - ' + this.item.name;
    let effect = chris.findEffect(targetActor, effectName);
    if (!effect) {
        let effectData = {
            'label': effectName,
            'icon': this.item.img,
            'duration': {
                'seconds': 2628000
            },
            'changes': [
                {
                    'key': 'system.attributes.hp.tempmax',
                    'mode': 2,
                    'value': Math.max(damage, -targetMaxHP),
                    'priority': 20
                }
            ]
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