import {chris} from '../../helperFunctions.js';
export async function hiddenPaths({speaker, actor, token, character, item, args, scope, workflow}) {
    let targetToken = workflow.targets.first();
    let maxRange = targetToken.actor === workflow.actor ? 60 : 30;
    let icon = targetToken.document.texture.src;
    let interval = targetToken.document.width % 2 === 0 ? 1 : -1;
    await workflow.actor.sheet.minimize();
    let position = await chris.aimCrosshair(workflow.token, maxRange, icon, interval, targetToken.document.width);
    if (position.cancelled) {
        await workflow.actor.sheet.maximize();
        return;
    }
    await new Sequence()
        .effect()
        .file('jb2a.misty_step.01.green')
        .atLocation(targetToken)
        .randomRotation()
        .scaleToObject(2)
        .wait(750)
        .animation()
        .on(targetToken)
        .opacity(0.0)
        .waitUntilFinished()
        .play();
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
    await new Sequence()
        .effect()
        .file('jb2a.misty_step.02.green')
        .atLocation(targetToken)
        .randomRotation()
        .scaleToObject(2)
        .wait(1500)
        .animation()
        .on(targetToken)
        .opacity(1.0)
        .play();
    await warpgate.wait(1000);
    await workflow.actor.sheet.maximize();
}
