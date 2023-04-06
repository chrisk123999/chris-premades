import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
export async function repellingBlast({speaker, actor, token, character, item, args}) {
    let spellName = this.actor.flags['chris-premades']?.feature?.repellingBlast?.name;
    if (!spellName) spellName = 'Eldritch Blast';
    if (this.item.name != spellName || this.hitTargets.size != 1) return;
    let queueSetup = await queue.setup(this.item.uuid, 'repellingBlast', 450);
    if (!queueSetup) return;
    let selection = await chris.dialog('Repelling Blast: How far do you push the target?', [['10 ft.', 10], ['5 ft.', 5], ['0 ft.', false]]);
    if (!selection) {
        queue.remove(this.item.uuid);
        return;
    }
    let targetToken = this.targets.first();
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
    let effect = chris.findEffect(this.actor, 'Eldritch Invocations: Repelling Blast');
    if (effect) {
        let originItem = await fromUuid(effect.origin);
        if (originItem) await originItem.use();
    }
    queue.remove(this.item.uuid);
}