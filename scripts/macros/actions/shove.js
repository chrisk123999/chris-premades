import {chris} from '../../helperFunctions.js';
import {translate} from '../../translations.js';
export async function shove({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let skipCheck = false;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    if (workflow.actor.uuid === targetActor.uuid) return;
    if ((chris.getSize(targetActor)) > (chris.getSize(actor) + 1)) {
        ui.notifications.info('Target is too big to shove!');
        return;
    }
    let effect = chris.findEffect(targetActor, 'Incapacitated');
    if (effect) skipCheck = true;
    if (!skipCheck) {
        let selection = await chris.remoteDialog(workflow.item.name, [[translate.skills('acr'), 'acr'], [translate.skills('ath'), 'ath'], ['Uncontested', false]], chris.firstOwner(targetToken).id, 'How would you like to contest the shove?');
        if (selection) {
            let sourceRoll = await workflow.actor.rollSkill('ath');
            let targetRoll = await chris.rollRequest(targetToken, 'skill', selection);
            if (targetRoll.total >= sourceRoll.total) return;
        }
    }
    let selection = await chris.dialog('What do you want to do?', [['Move', 'move'], ['Knock Prone', 'prone']]);
    if (!selection) return;
    if (selection === 'prone') {
        await chris.addCondition(targetActor, 'Prone', false, null);
        return;
    } else {
        let distance = 5;
        let knockBackFactor;
        let ray;
        let newCenter;
        let hitsWall = true;
        let targetToken = workflow.targets.first();
        while (hitsWall) {
            knockBackFactor = distance / canvas.dimensions.distance;
            ray = new Ray(workflow.token.center, targetToken.center);
            if (ray.distance === 0) {
                ui.notifications.info('Target is unable to be moved!');
                queue.remove(workflow.item.uuid);
                return;
            }
            newCenter = ray.project(1 + ((canvas.dimensions.size * knockBackFactor) / ray.distance));
            hitsWall = targetToken.checkCollision(newCenter, {origin: ray.A, type: "move", mode: "any"});
            if (hitsWall) {
                distance -= 5;
                if (distance === 0) {
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
        let options2 = {
            'permanent': true,
            'name': workflow.item.name,
            'description': workflow.item.name
        };
        await warpgate.mutate(targetToken.document, targetUpdate, {}, options2);
    }
}