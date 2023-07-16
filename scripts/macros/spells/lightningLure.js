import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function lightningLure({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'lightningLure', 50);
    if (!queueSetup) return;
    let targetToken = workflow.targets.first();
    let distance = chris.getDistance(workflow.token, targetToken);
    let selection = -10;
    if (distance <= 5) {
        queue.remove(workflow.item.uuid);
        return;
    } else if (distance > 5 && distance <= 10) {
        selection = -5;
    }
    let knockBackFactor;
    let ray;
    let newCenter;
    let hitsWall = true;
    while (hitsWall) {
        knockBackFactor = selection / canvas.dimensions.distance;
        ray = new Ray(workflow.token.center, targetToken.center);
        if (ray.distance === 0) {
            ui.notifications.info('Target is unable to be moved!');
            queue.remove(workflow.item.uuid);
            return;
        }
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
    distance = chris.getDistance(workflow.token, targetToken);
    if (distance > 5) {
        let damageRoll = await new Roll('0').roll({async: true});
        await workflow.setDamageRoll(damageRoll);
    }
    queue.remove(workflow.item.uuid);
}