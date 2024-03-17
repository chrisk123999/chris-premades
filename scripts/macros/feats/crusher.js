import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function critical({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.damageRoll || !workflow.isCritical) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'crusherCritical', 450);
    if (!queueSetup) return;
    if (!chris.getRollsDamageTypes(workflow.damageRolls).has('bludgeoning')) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let feature = chris.getItem(workflow.actor, 'Crusher: Critical');
    if (!feature) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let effetData = {
        'name': feature.name,
        'icon': feature.img,
        'origin': feature.uuid,
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
    await feature.use();
    queue.remove(workflow.item.uuid);
}
async function move({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.damageRoll || !constants.attacks.includes(workflow.item.system.actionType)) return;
    let targetToken = workflow.targets.first();
    let targetSize = chris.getSize(targetToken.actor, false);
    if (targetSize > (chris.getSize(workflow.actor, false) + 1)) return;
    let feature = chris.getItem(workflow.actor, 'Crusher');
    if (!feature) return;
    let turnCheck = chris.perTurnCheck(feature, 'feat', 'crusher', false);
    if (!turnCheck) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'crusher', 450);
    if (!queueSetup) return;
    let damageTypes = chris.getRollsDamageTypes(workflow.damageRolls);
    if (!damageTypes.has('bludgeoning')) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let selection = await chris.dialog(feature.name, constants.yesNo, 'Move target?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await workflow.actor.sheet.minimize();
    let icon = targetToken.document.texture.src;
    let interval = targetToken.document.width % 2 === 0 ? 1 : -1;
    let position = await chris.aimCrosshair(targetToken, 5, icon, interval, targetToken.document.width);
    if (position.cancelled) {
        await workflow.actor.sheet.maximize();
        queue.remove(workflow.item.uuid);
        return;
    }
    let newCenter = canvas.grid.getSnappedPosition(position.x - targetToken.w / 2, position.y - targetToken.h / 2, 1);
    let targetUpdate = {
        'token': {
            'x': newCenter.x,
            'y': newCenter.y
        }
    };
    let options = {
        'permanent': true,
        'name': feature.name,
        'description': feature.name
    };
    await warpgate.mutate(targetToken.document, targetUpdate, {}, options);
    await workflow.actor.sheet.maximize();
    await feature.displayCard();
    queue.remove(workflow.item.uuid);
}
export let crusher = {
    'critical': critical,
    'move': move
}