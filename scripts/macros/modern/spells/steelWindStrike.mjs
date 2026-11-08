import {automationUtils, workflowUtils} from '../../../proxy.mjs';
async function vanish({document: item, workflow}) {
    if (!workflow.token || workflow.workflowOptions?.rollAttackPerTarget) return;
    const targets = Array.from(workflow.targets, target => target.document).filter(target => target !== workflow.token.document);
    if (!targets.length) return;
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    if (!animation) return;
    await animation.macros.start(workflow.token.document, targets, options);
    workflowUtils.setWorkflowProperty(workflow, 'steelWindStrikeVanished', true);
}
async function reappear({document: item, workflow}) {
    if (workflow.workflowOptions?.rollAttackPerTarget || !workflowUtils.getWorkflowProperty(workflow, 'steelWindStrikeVanished')) return;
    const {animation} = automationUtils.getResolvedAnimation(item, 'animation');
    await animation?.macros.end(workflow.token.document);
}
export const steelWindStrike = {
    name: 'Steel Wind Strike',
    version: '2.1.8',
    rules: '2024',
    roll: [
        {pass: 'itemPreambleComplete', macro: vanish, priority: 50},
        {pass: 'itemRollFinished', macro: reappear, priority: 100}
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'steelWindStrike'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targets', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
