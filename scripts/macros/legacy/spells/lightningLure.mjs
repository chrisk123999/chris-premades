import {automationUtils, genericUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function damage({document, workflow, targetToken, ditem}) {
    if (!workflow.token) return;
    const sourceToken = workflow.token.document;
    const gap = tokenUtils.getDistance(sourceToken, targetToken);
    const distance = workflow.failedSaves.has(targetToken.object) ? Math.min(10, Math.floor((gap - 4) / 5) * 5) : 0;
    const move = distance > 0 ? () => tokenUtils.slideToken(targetToken, {sourceToken, distance: -genericUtils.convertDistance(sourceToken.parent, distance)}) : undefined;
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    if (animation?.macros?.play) await animation.macros.play(sourceToken, targetToken, {...options, move});
    else if (move) await move();
    await targetToken.object?.movementAnimationPromise;
    if (tokenUtils.getDistance(sourceToken, targetToken) > 5) workflowUtils.negateDamageItemDamage(ditem);
}
export const lightningLure = {
    name: 'Lightning Lure',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'itemDamage',
            macro: damage,
            priority: 50
        }
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'castBeam'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
