import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function critical({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.damageRoll || !workflow.isCritical) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'crusherCritical', 450);
    if (!queueSetup) return;
    if (!chris.getRollDamageTypes(workflow.damageRoll).has('bludgeoning')) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let effect = chris.findEffect(workflow.actor, 'Crusher: Critical');
    if (!effect) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let originItem = await fromUuid(effect.origin);
    if (!originItem) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let effetData = {
        'label': originItem.name,
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': 12
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
    await chris.createEffect(workflow.targets.first().actor, effetData);
}
async function move ({speaker, actor, token, character, item, args, scope, workflow}) {
    
}
export let crusher = {
    'critical': critical,
    'move': move
}