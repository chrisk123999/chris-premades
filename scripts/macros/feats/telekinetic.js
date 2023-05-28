import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
export async function telekinetic({speaker, actor, token, character, item, args}) {
    if (this.failedSaves.size != 1) return;
    let targetToken = this.targets.first();
    let distance = chris.getDistance(this.token, targetToken);
    let selection = await chris.dialog('Which way?', [['Toward', -5], ['Away', 5]]);
    if (!selection) return;
    let knockBackFactor;
    let ray;
    let newCenter;
    let hitsWall = true;
    while (hitsWall) {
        knockBackFactor = selection / canvas.dimensions.distance;
        ray = new Ray(this.token.center, targetToken.center);
        if (ray.distance === 0) {
            ui.notifications.info('Target is unable to be moved!');
            queue.remove(this.item.uuid);
            return;
        }
        newCenter = ray.project(1 + ((canvas.dimensions.size * knockBackFactor) / ray.distance));
        hitsWall = targetToken.checkCollision(newCenter, {origin: ray.A, type: "move", mode: "any"});
        if (hitsWall) {
            selection -= 5;
            if (selection === 0) {
                ui.notifications.info('Target is unable to be moved!');
                queue.remove(this.item.uuid);
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
        'name': this.item.name,
        'description': this.item.name
    };
    await warpgate.mutate(targetToken.document, targetUpdate, {}, options);
    distance = chris.getDistance(this.token, targetToken);
}