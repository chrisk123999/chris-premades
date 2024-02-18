import {chris} from '../../../../helperFunctions.js';
export async function mightyImpel({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.failedSaves.size) return;
    let targetToken = workflow.targets.first();
    let targetSize = chris.getSize(targetToken.actor);
    let demiurgicColossus = chris.getItem(workflow.actor, 'Demiurgic Colossus');
    let maxSize = demiurgicColossus ? 3 : 2;
    if (targetSize > maxSize) return;
    await workflow.actor.sheet.minimize();
    let icon = targetToken.document.texture.src;
    let interval = targetToken.document.width % 2 === 0 ? 1 : -1;
    let position = await chris.aimCrosshair(targetToken, 30, icon, interval, targetToken.document.width);
    if (position.cancelled) {
        await workflow.actor.sheet.maximize();
        return;
    }
    let newCenter = canvas.grid.getSnappedPosition(position.x - targetToken.w / 2, position.y - targetToken.h / 2, 1);
    let targetUpdate = {
        'token': {
            'x': newCenter.x,
            'y': newCenter.y
        }
    };
    let options = {
        'permanent': true,
        'name': 'Mighty Impel',
        'description': 'Mighty Impel'
    };
    await warpgate.mutate(targetToken.document, targetUpdate, {}, options);
    await workflow.actor.sheet.maximize();
}