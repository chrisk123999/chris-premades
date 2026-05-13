import {activityUtils, crosshairUtils, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function cast({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || !(workflow.item.type === 'spell' || itemUtils.isSpellFeature(workflow.item))) return;
    let validTargets = [];
    if (workflowUtils.isAttackType(workflow, 'spellAttack')) {
        if (!workflow.hitTargets.size) return;
        validTargets.push(workflow.hitTargets.first());
    } else if (activityUtils.hasSave(workflow.activity)) {
        validTargets.push(...workflow.failedSaves);
    } else {
        validTargets.push(...workflow.targets.filter(token => token.document.disposition === workflow.token.document.disposition));
    }
    if (!validTargets.length) return;
    let used = false;
    for (let token of validTargets) {
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.GravityWell.Move', {token: token.document.name, item: item.name}));
        if (!selection) continue;
        let actualHalf = token.document.width / 2;
        let widthAdjust = canvas.grid.distance * Math.floor(actualHalf);
        let fudgeDistance = 0;
        if (widthAdjust !== actualHalf * canvas.grid.distance) fudgeDistance = 2.5;
        fudgeDistance += widthAdjust;
        let position = await crosshairUtils.aimCrosshair({
            token: token,
            centerpoint: token.center,
            maxRange: 5,
            fudgeDistance,
            drawBoundries: true,
            trackDistance: true,
            crosshairsConfig: {
                size: canvas.grid.distance * token.document.width / 2,
                icon: token.document.texture.src,
                resolution: (token.document.width % 2) ? 1 : -1
            }
        });
        if (position.cancelled) continue;
        let xOffset = token.document.width * canvas.grid.size / 2;
        let yOffset = token.document.height * canvas.grid.size / 2;
        await genericUtils.update(token.document, {x: (position.x ?? token.document.center.x) - xOffset, y: (position.y ?? token.document.center.y) - yOffset});
        used = true;
    }
    if (used) await item.displayCard();
}
export let gravityWell = {
    name: 'Gravity Well',
    version: '1.5.31',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: cast,
                priority: 800
            }
        ]
    }
};