import {workflowUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let friendlyTargets = workflow.targets.filter(i => i.document.disposition === workflow.token.document.disposition);
    console.log(friendlyTargets);
    if (!friendlyTargets.length) return;
}
async function damage({trigger, workflow, ditem}) {
    let tokenDocument = await fromUuid(ditem.tokenUuid);
    if (workflow.token.document.disposition != tokenDocument.disposition) return;
    workflowUtils.negateDamageItemDamage(ditem);
}
export let witherAndBloom = {
    name: 'Wither and Bloom',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: use,
                priority: 50
            },
            {
                pass: 'applyDamage',
                macro: damage,
                priority: 50
            }
        ]
    }
};