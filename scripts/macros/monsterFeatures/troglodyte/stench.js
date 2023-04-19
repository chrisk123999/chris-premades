import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
export async function stench(token, origin, range, duration, monsterName, originItem) {
    let targetToken = game.combat.scene.tokens.get(game.combat.current.tokenId);
    if (!targetToken) return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > range) return;
    let sourceActor = game.actors.get(token.document.actorId);
    if (!sourceActor) return;
    if (!monsterName) monsterName = sourceActor.name.split(' ').join('-').toLowerCase();
    if (!originItem) originItem = origin;
    let originEffectName = originItem.name;
    let queueSetup = await queue.setup(origin.uuid, 'stench', 50);
    if (!queueSetup) return;
    if (targetToken.actor.flags['chris-premades']?.monster?.[monsterName]?.feature?.stenchImmune) {
        queue.remove(origin.uuid);
        return;
    }
    if (chris.findEffect(targetToken.actor, originEffectName)) {
        queue.remove(origin.uuid);
        return;
    }
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetToken.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
    let featureWorkflow = await MidiQOL.completeItemUse(originItem, {}, options);
    if (featureWorkflow.failedSaves.size != 0) {
        queue.remove(origin.uuid);
        return;
    }
    let effectData = {
        'label': originItem.name + ' Immune',
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': duration
        },
        'changes': [
            {
                'key': 'flags.chris-premades.monster.' + monsterName + '.feature.stenchImmune',
                'mode': 5,
                'value': true,
                'priority': 20
            }
        ]
    }
    await chris.createEffect(targetToken.actor, effectData);
    queue.remove(origin.uuid);
}