import {chris} from '../../../helperFunctions.js';
export async function tentacle({speaker, actor, token, character, item, args}) {
	if (this.hitTargets.size != 1 || this.failedSaves.size != 1) return;
	let damageRoll = await new Roll('1d6').roll({async: true});
	damageRoll.toMessage({
		rollMode: 'roll',
		speaker: {alias: name},
		flavor: this.item.name
	});
	let damage = -damageRoll.total;
    let targetActor = this.targets.first().actor;
    let targetMaxHP = targetActor.system.attributes.hp.max;
    let effect = chris.findEffect(targetActor, 'Dybbuk - Tentacle');
    if (!effect) {
        let effectData = {
            'label': 'Dybbuk - Tentacle',
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