import {actorUtils, crosshairUtils, genericUtils, itemUtils} from '../../../../../utils.js';

async function use({workflow}) {
    if (!workflow.failedSaves.size) return;
    let targetToken = workflow.targets.first();
    let targetSize = actorUtils.getSize(targetToken.actor);
    let demiurgicColossus = itemUtils.getItemByIdentifier(workflow.actor, 'demiurgicColossus');
    let maxSize = demiurgicColossus ? 3 : 2;
    if (targetSize > maxSize) return;
    await workflow.actor.sheet.minimize();
    let position = await crosshairUtils.aimCrosshair({
        token: workflow.token, 
        maxRange: genericUtils.convertDistance(30), 
        crosshairsConfig: {
            size: canvas.grid.distance * targetToken.document.width / 2,
            icon: targetToken.document.texture.src, 
            resolution: (targetToken.document.width % 2) ? 1 : -1
        }, 
        drawBoundries: true});
    if (position.cancelled) {
        await workflow.actor.sheet.maximize();
        return;
    }
    await genericUtils.update(targetToken.document, {
        x: position.x - (canvas.scene.grid.sizeX * targetToken.document.width / 2),
        y: position.y - (canvas.scene.grid.sizeY * targetToken.document.height / 2),
    });
    await workflow.actor.sheet.maximize();
}
export let mightyImpel = {
    name: 'Mighty Impel',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};