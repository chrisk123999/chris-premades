import {automationUtils, crosshairUtils, dialogUtils, distanceUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function cast({document: item, workflow}) {
    if (!workflow.targets.count || !(workflow.item.type === 'spell' || workflow.item.system.type?.value === 'spellFeature')) return;
    const moveDistance = automationUtils.getConfigValue(item, 'moveDistance') ?? 5;
    const allowAllTargets = automationUtils.getConfigValue(item, 'allowAllTargets');
    const validTargets = [];
    if (workflowUtils.isAttackType(workflow, 'spellAttack')) {
        if (!workflow.hitTargets.count) return;
        validTargets.push(...workflow.hitTargets.tokens);
    } else if (workflow.activity?.hasSave) {
        validTargets.push(...workflow.failedSaves.tokens);
    } else if (allowAllTargets) {
        validTargets.push(...workflow.targets.tokens);
    } else {
        validTargets.push(...workflow.targets.tokens.filter(token => token.document.disposition === workflow.tokenDocument.disposition));
    }
    if (!validTargets.length) return;
    let token;
    if (validTargets.length === 1) {
        const selection = await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Legacy.GravityWell.Move', {token: validTargets[0].document.name, item: item.name}));
        if (!selection) return;
        token = validTargets[0].document;
    } else {
        const selection = await dialogUtils.selectTargetDialog(item.name, _loc('CHRISPREMADES.Macros.Legacy.GravityWell.Select', {item: item.name, distance: moveDistance}), validTargets.map(i => i.document), {type: 'one'});
        token = selection?.result;
    }
    if (!token) return;
    const position = await crosshairUtils.aimCrosshair({
        token,
        centerpoint: token.object.center,
        maxRange: moveDistance,
        fudgeDistance: distanceUtils.fromGridSpaces(canvas.scene, token.width / 2),
        drawBoundries: true,
        trackDistance: true
    });
    if (!position || position.cancelled) return;
    await tokenUtils.displaceToken(token, {destination: position, sourceToken: workflow.token.document, range: moveDistance});
    await item.displayCard();
}
export const gravityWell = {
    name: 'Gravity Well',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: cast,
            priority: 800
        }
    ],
    config: {
        moveDistance: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            category: 'homebrew'
        },
        allowAllTargets: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Legacy.GravityWell.AllowAllTargets',
            category: 'targeting'
        }
    }
};
