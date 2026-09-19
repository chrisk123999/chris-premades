import {actorUtils, animationUtils, automationUtils, crosshairUtils, dialogUtils, genericUtils, tokenUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    const token = workflow.token.document;
    const range = automationUtils.getConfigValue(document, 'range');
    const identifiers = automationUtils.getConfigValue(document, 'identifiers');
    const cursed = tokenUtils.findNearby(token, automationUtils.getConfigValue(document, 'teleportRange') + range, {disposition: 'enemy'})
        .filter(nearbyToken => identifiers.some(identifier => actorUtils.getEffectByIdentifier(nearbyToken.actor, identifier)));
    if (!cursed.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.RelentlessHex.NoTargets', {type: 'info'});
        return;
    }
    const targetToken = cursed.length === 1 ? cursed[0] : (await dialogUtils.selectTargetDialog(document.name, _loc('CHRISPREMADES.Macros.Legacy.RelentlessHex.Select'), cursed, {type: 'one'}))?.result;
    if (!targetToken) return;
    const destination = await crosshairUtils.aimCrosshair({
        token,
        maxRange: range,
        centerpoint: targetToken.object.center,
        fudgeDistance: targetToken.width * canvas.dimensions.distance / 2,
        crosshairsConfig: {
            size: canvas.grid.distance * token.width / 2,
            icon: token.texture.src,
            resolution: (token.width % 2) ? 1 : -1
        }
    });
    if (!destination || destination.cancelled) return;
    const animation = animationUtils.getAnimation(automationUtils.getConfigValue(document, 'animation'));
    await tokenUtils.teleportToken(token, {destination, animation, range});
}
export const relentlessHex = {
    name: 'Eldritch Invocations: Relentless Hex',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        teleportRange: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            category: 'homebrew'
        },
        identifiers: {
            default: ['hex', 'hexbladesCurseTarget', 'signOfIllOmen'],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Macros.Legacy.RelentlessHex.Identifiers',
            category: 'homebrew'
        },
        range: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'mistyStep'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'visuals'
        }
    }
};
