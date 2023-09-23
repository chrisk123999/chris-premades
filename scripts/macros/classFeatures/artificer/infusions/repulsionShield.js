import {queue} from '../../../../utility/queue.js';
import {chris} from '../../../../helperFunctions.js';
export async function repulsionShield({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'repulsionShield', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog(workflow.item.name, [['15 ft.', 15], ['10 ft.', 10], ['5 ft.', 5]], 'How far do you push the target?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let targetToken = workflow.targets.first();
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