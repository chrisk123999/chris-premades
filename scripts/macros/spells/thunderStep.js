import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function thunderStep({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'thunderStep', 450);
    if (!queueSetup) return;
    let casterSize = chris.getSize(workflow.actor);
    let nearbyTargets = chris.findNearby(workflow.token, 5, 'ally').filter(t => chris.getSize(t.actor) <= casterSize);
    let selection;
    let selectedTargets = [workflow.token];
    if (nearbyTargets.length > 0) {
        let buttons = [
            {
                'label': 'Yes',
                'value': true
            }, {
                'label': 'No',
                'value': false
            }
        ];
        selection = await chris.selectTarget('Teleport a Creature?', buttons, nearbyTargets, true, 'one');
        if (selection.buttons) {
            let selectedTarget = selection.inputs.find(id => id != false);
            if (selectedTarget) {
                chris.updateTargets(Array.from(workflow.targets).filter(t => t.document.uuid != selectedTarget).map(t => t.id));
                selectedTargets.push((await fromUuid(selectedTarget)).object);
            }
        }
    }
    await workflow.actor.sheet.minimize();
    let icon = workflow.token.document.texture.src;
    let position = await chris.aimCrosshair(workflow.token, 90, icon, -1, workflow.token.document.width);
    queue.remove(workflow.item.uuid);
    if (position.cancelled) {
        await workflow.actor.sheet.maximize();
        return;
    }
    let difference = {x: workflow.token.x, y: workflow.token.y};
    await new Sequence().effect().file('jb2a.thunderwave.center.blue').atLocation(workflow.token).randomRotation().animation().play();
    async function teleport(targetToken) {
        await new Sequence().effect().file('jb2a.misty_step.01.blue').atLocation(targetToken).randomRotation().scaleToObject(2).wait(750).animation().on(targetToken).opacity(0.0).waitUntilFinished().play();
        let diffX = targetToken.x - difference.x;
        let diffY = targetToken.y - difference.y;
        let newCenter = canvas.grid.getSnappedPosition(position.x - targetToken.w / 2, position.y - targetToken.h / 2, 1);
        let targetUpdate = {
            'token': {
                'x': newCenter.x + diffX,
                'y': newCenter.y + diffY
            }
        };
        let options = {
            'permanent': true,
            'name': workflow.item.name,
            'description': workflow.item.name,
            'updateOpts': {'token': {'animate': false}}
        };
        await warpgate.mutate(targetToken.document, targetUpdate, {}, options);
        await new Sequence().effect().file('jb2a.misty_step.02.blue').atLocation(targetToken).randomRotation().scaleToObject(2).wait(500).animation().on(targetToken).opacity(1.0).play();
    }
    for (let i = 0; selectedTargets.length > i; i++) {
        let targetToken = selectedTargets[i];
        teleport(targetToken);
    }
    await warpgate.wait(2000);
    await workflow.actor.sheet.maximize();
}