import {chris} from '../../helperFunctions.js';
export async function thornWhip({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let targetToken = workflow.targets.first();
    if ((chris.getSize(targetToken.actor)) > (chris.sizeStringValue('large'))) {
        ui.notifications.info('Target is unable to be moved!');
        return;
    }
    let distance = chris.getDistance(workflow.token, targetToken);
    let selection = await chris.dialog('How far do you pull the target?', [['0 ft.', false], ['5 ft.', -5], ['10 ft.', -10]]);
    if (!selection) return;
    if (distance <= 5) {
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
            return;
        }
        newCenter = ray.project(1 + ((canvas.dimensions.size * knockBackFactor) / ray.distance));
        hitsWall = targetToken.checkCollision(newCenter, {origin: ray.A, type: "move", mode: "any"});
        if (hitsWall) {
            selection -= 5;
            if (selection === 0) {
                ui.notifications.info('Target is unable to be moved!');
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
}