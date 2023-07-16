import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function repellingBlast({speaker, actor, token, character, item, args, scope, workflow}) {
    let spellName = workflow.actor.flags['chris-premades']?.feature?.repellingBlast?.name;
    if (!spellName) spellName = 'Eldritch Blast';
    if (workflow.item.name != spellName || workflow.hitTargets.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'repellingBlast', 450);
    if (!queueSetup) return;
    let selection = await chris.dialog('Repelling Blast: How far do you push the target?', [['10 ft.', 10], ['5 ft.', 5], ['0 ft.', false]]);
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
    let effect = chris.findEffect(workflow.actor, 'Eldritch Invocations: Repelling Blast');
    if (effect) {
        let originItem = await fromUuid(effect.origin);
        if (originItem) await originItem.use();
    }
    queue.remove(workflow.item.uuid);
}