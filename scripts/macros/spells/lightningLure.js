import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
export async function lightningLure({speaker, actor, token, character, item, args}) {
    if (this.failedSaves.size != 1) return;
    let queueSetup = await queue.setup(this.item.uuid, 'lightningLure', 50);
    if (!queueSetup) return;
    let targetToken = this.targets.first();
    let distance = chris.getDistance(this.token, targetToken);
    let selection = -10;
    if (distance <= 5) {
        queue.remove(this.item.uuid);
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
        ray = new Ray(this.token.center, targetToken.center);
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
    if (distance > 5) {
        let damageRoll = await new Roll('0').roll({async: true});
        await this.setDamageRoll(damageRoll);
    }
    queue.remove(this.item.uuid);
}