import {chris} from '../../helperFunctions.js';
export async function vortexWarp({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1) return;
    let targetToken = workflow.targets.first();
    let maxRange = 90 + (30 * (workflow.castData.castLevel - 2));
    let icon = targetToken.document.texture.src;
    let interval = -1;
    if (chris.getSize(targetToken.actor, false) > 2) interval = 1;
    await workflow.actor.sheet.minimize();
    let position = await chris.aimCrosshair(workflow.token, maxRange, icon, interval, targetToken.document.width);
    if (position.cancelled) {
        await workflow.actor.sheet.maximize();
        return;
    }
    await new Sequence().effect().file('jb2a.misty_step.01.blue').atLocation(targetToken).randomRotation().scaleToObject(2).wait(750).animation().on(targetToken).opacity(0.0).waitUntilFinished().play();
    let newCenter = canvas.grid.getSnappedPosition(position.x - targetToken.w / 2, position.y - targetToken.h / 2, 1);
    let targetUpdate = {
        'token': {
            'x': newCenter.x,
            'y': newCenter.y
        }
    };
    let options = {
        'permanent': true,
        'name': workflow.item.name,
        'description': workflow.item.name,
        'updateOpts': {'token': {'animate': false}}
    };
    await warpgate.mutate(targetToken.document, targetUpdate, {}, options);
    await new Sequence().effect().file('jb2a.misty_step.02.blue').atLocation(targetToken).randomRotation().scaleToObject(2).wait(1500).animation().on(targetToken).opacity(1.0).play();
    await warpgate.wait(1000);
    await workflow.actor.sheet.maximize();
}