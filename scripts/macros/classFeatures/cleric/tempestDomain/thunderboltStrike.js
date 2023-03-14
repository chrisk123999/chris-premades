import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
export async function thunderboltStrike(workflow) {
    if (workflow.hitTargets.size === 0) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    if (!(targetActor.system.traits.size === 'lg' || targetActor.system.traits.size === 'med' || targetActor.system.traits.size === 'sm' || targetActor.system.traits.size === 'tiny')) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'thunderboltStrike', 475);
    if (!queueSetup) return;
    let damageTypes = chris.getRollDamageTypes(workflow.damageRoll);
    if (!damageTypes.has('lightning')) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let selection = await chris.dialog('Thunderbolt Strike: Push target?', [['Yes', 10], ['No', false]]);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
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
    queue.remove(workflow.item.uuid);
}