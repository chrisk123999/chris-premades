import {dialogUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function use({document: item, workflow}) {
    if (!workflow.token) return;
    const token = workflow.token.document;
    const reverseCover = workflow.targets.has(workflow.token);
    const selected = workflow.targets.tokens.map(target => target.document).filter(target => target !== token);
    const targets = selected.length ? selected : token.parent.tokens.filter(target => target !== token && target.actor && tokenUtils.canSense(token, target));
    if (!targets.length) return;
    const content = reverseCover ? 'CHRISPREMADES.Macros.All.CheckCover.YourCover' : 'CHRISPREMADES.Macros.All.CheckCover.TargetCover';
    const selection = await dialogUtils.selectTargetDialog(item.name, content, targets, {type: 'multiple', maxAmount: targets.length, skipDeadAndUnconscious: false, coverToken: token, reverseCover, displayDistance: true});
    if (!selection?.result) return;
    await workflowUtils.updateTargets(workflow, selection.result);
}
export const checkCover = {
    name: 'Check Cover',
    version: '2.1.8',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
