import {dialogUtils, genericUtils, workflowUtils} from '../../../utils.js';
async function early({workflow}) {
    if (!workflow.targets.size) return;
    let sourceDisposition = workflow.token.document.disposition;
    let targetTokens = Array.from(workflow.targets.filter(i => i.document.disposition === sourceDisposition));
    if (!targetTokens.length || targetTokens.length <= 6) {
        await workflowUtils.updateTargets(workflow, targetTokens);
        return;
    }
    let [selection] = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.MassCureWounds.Select', targetTokens, {type: 'multiple', maxAmount: 6});
    let newTargets;
    if (!selection) {
        newTargets = targetTokens.slice(0, 6);
    } else {
        newTargets = selection ?? [];
    }
    await workflowUtils.updateTargets(workflow, newTargets);
}
export let massCureWounds = {
    name: 'Mass Cure Wounds',
    version: '1.2.24',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};