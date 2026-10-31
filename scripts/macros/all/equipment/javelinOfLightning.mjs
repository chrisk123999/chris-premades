import {automationUtils, documentUtils, itemUtils, workflowUtils} from '../../../proxy.mjs';
function lineTokens(sourceToken, targetToken) {
    const scene = sourceToken.parent;
    const halfWidth = 2.5 * scene.grid.size / scene.grid.distance;
    const start = sourceToken.object.center;
    const end = targetToken.object.center;
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    if (!length) return [];
    return scene.tokens.filter(token => {
        if (!token.actor || token === sourceToken || token === targetToken || token.hidden) return false;
        const center = token.object.center;
        const along = ((center.x - start.x) * (end.x - start.x) + (center.y - start.y) * (end.y - start.y)) / length;
        if (along <= 0 || along > length) return false;
        const across = Math.abs((center.x - start.x) * (end.y - start.y) - (center.y - start.y) * (end.x - start.x)) / length;
        return across < halfWidth + token.object.w / 2;
    });
}
async function bolt({document: item, workflow}) {
    if (workflow.activity.identifier !== 'javelin-of-lightning-bolt' || !workflow.token || workflow.targets.size !== 1) return;
    const target = workflow.targets.first().document;
    const save = itemUtils.getActivityByIdentifier(item, 'javelin-of-lightning-save');
    const tokens = lineTokens(workflow.token.document, target);
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    if (animation?.macros?.play) animation.macros.play(workflow.token.document, target, {...options, damageType: 'lightning'});
    if (documentUtils.getRules(item) === '2024') tokens.push(target);
    else workflowUtils.setWorkflowProperty(workflow, 'javelinOfLightning', true);
    if (save && tokens.length) await workflowUtils.syntheticActivityRoll(save, tokens, {consumeUsage: false, consumeResources: false});
}
async function damage({workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'javelinOfLightning') || !workflow.hitTargets.size) return;
    await workflowUtils.bonusDamage(workflow, '4d6', {damageType: 'lightning'});
}
export const javelinOfLightning = {
    name: 'Javelin of Lightning',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: bolt,
            priority: 50
        },
        {
            pass: 'itemDamageRollComplete',
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
