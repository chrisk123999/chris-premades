import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let spellName = workflow.actor.flags['chris-premades']?.feature?.graspOfHadar?.name;
    if (!spellName) spellName = 'Eldritch Blast';
    if (workflow.item.name != spellName || workflow.hitTargets.size != 1) return;
    let targetToken = workflow.targets.first();
    let distance = chris.getDistance(workflow.token, targetToken);
    if (distance <= 5) return;
    let effect = chris.findEffect(workflow.actor, 'Eldritch Invocations: Grasp of Hadar');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    if (!chris.perTurnCheck(originItem, 'feature', 'graspOfHadar', true, workflow.token.id)) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'graspOfHadar', 451);
    if (!queueSetup) return;
    let selection = await chris.dialog('Use Grasp of Hadar?', [['Yes', -10], ['No', false]]);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    if (chris.inCombat()) await originItem.setFlag('chris-premades', 'feature.graspOfHadar.turn', game.combat.round + '-' + game.combat.turn);
    if (distance <= 10) selection = -5;
    let knockBackFactor;
    let ray;
    let newCenter;
    let hitsWall = true;
    while (hitsWall) {
        knockBackFactor = selection / canvas.dimensions.distance;
        ray = new Ray(workflow.token.center, targetToken.center);
        newCenter = ray.project(1 + ((canvas.dimensions.size * knockBackFactor) / ray.distance));
        hitsWall = targetToken.checkCollision(newCenter, {origin: ray.A, type: "move", mode: "any"});
        if (hitsWall) {
            selection -= 5;
            if (selection === 0) {
                ui.notifications.info('Target is unable to be moved!');
                queue.remove(workflow.item.uuid);
                return;
            }
        }
    }
    newCenter = canvas.grid.getSnappedPosition(newCenter.x - targetToken.w / 2, newCenter.y - targetToken.h / 2, 1);
    let targetUpdate = {
        'token': {
            'x': newCenter.x,
            'y': newCenter.y
        }
    };
    let options = {
        'permanent': true,
        'name': workflow.item.name,
        'description': workflow.item.name
    };
    await warpgate.mutate(targetToken.document, targetUpdate, {}, options);
    await originItem.use();
    queue.remove(workflow.item.uuid);
}
async function combatEnd(origin) {
    await origin.setFlag('chris-premades', 'feature.graspOfHadar.turn', '');
}
export let graspOfHadar = {
    'item': item,
    'combatEnd': combatEnd
}