import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function critical({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1 || !this.damageRoll || !this.isCritical) return;
    let queueSetup = await queue.setup(this.item.uuid, 'crusherCritical', 450);
    if (!queueSetup) return;
    if (!chris.getRollDamageTypes(this.damageRoll).has('bludgeoning')) {
        queue.remove(this.item.uuid);
        return;
    }
    let effect = chris.findEffect(this.actor, 'Crusher: Critical');
    if (!effect) {
        queue.remove(this.item.uuid);
        return;
    }
    let originItem = await fromUuid(effect.origin);
    if (!originItem) {
        queue.remove(this.item.uuid);
        return;
    }
    let effetData = {
        'label': originItem.name,
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'rounds': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.grants.advantage.attack.all',
                'mode': 0,
                'value': '1',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'turnStartSource'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(this.targets.first().actor, effetData);
}
export let crusher = {
    'critical': critical
}