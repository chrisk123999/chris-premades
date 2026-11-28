import {dialogUtils, documentUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function editRegion({document: region, workflow}) {
    await workflowUtils.removeTargets(workflow, workflow.targets.documents);
    const parent = await fromUuid(region.flags.dnd5e?.dependentOn);
    if (parent) {
        parent.system.changes.push({key: 'flags.gambits-premades.oaImmunity', type: 'override', value: 1});
        await documentUtils.update(parent, {'system.changes': parent.system.changes});
    }
    await documentUtils.setFlag(region, 'chris-premades', 'balmOfPeace', {
        spent: tokenUtils.movementSpent(workflow.tokenDocument),
        bonus: workflow.actor.system.attributes.movement.speed
    });
}
const pending = new Map();
async function moved({document: region}) {
    const flags = region.flags['chris-premades']?.balmOfPeace;
    const movement = tokenUtils.movementSpent(region.attachment.token);
    if (!flags || movement - flags.spent < flags.bonus) return;
    let prompt = pending.get(region.uuid);
    if (prompt === undefined || prompt === false) {
        prompt = dialogUtils.confirm('COMMON.Confirm', 'CHRISPREMADES.Macros.Legacy.BalmOfPeace');
        prompt.then(() => pending.delete(region.uuid));
    }
    pending.set(region.uuid, prompt);
    if (!await prompt) return;
    const parent = await fromUuid(region.flags.dnd5e?.dependentOn);
    await documentUtils.deleteDocument(parent ?? region);
    pending.delete(region.uuid);
}
export const balmOfPeaceRegion = {
    name: 'Channel Divinity: Balm of Peace',
    version: '2.1.11',
    rules: '2014',
    region: [
        {
            pass: 'created',
            macro: editRegion,
            priority: 50
        },
        {
            pass: 'moved',
            macro: moved,
            priority: 50
        }
    ]
};
