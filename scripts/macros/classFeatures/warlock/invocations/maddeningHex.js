import {tokenUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    if (workflow.targets.size !== 1) return;
    let targets = tokenUtils.findNearby(workflow.targets.first(), 5, 'ally');
    if (!targets.length) return;
    let defaultDamageType = workflow.defaultDamageType;
    await workflowUtils.applyDamage(targets, workflow.damageTotal, defaultDamageType);
}
export let maddeningHex = {
    name: 'Eldritch Invocations: Maddening Hex',
    version: '0.12.54',
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