import {rollUtils, workflowUtils} from '../../../proxy.mjs';
async function transfer({workflow}) {
    if (workflow.targets.size !== 1 || !workflow.token) return;
    const roll = await rollUtils.damageRoll((workflowUtils.getCastLevel(workflow) + 1) + 'd8', workflow.item, {type: 'necrotic'});
    await roll.toMessage({speaker: ChatMessage.implementation.getSpeaker({token: workflow.token.document}), flavor: workflow.item.name});
    await workflowUtils.applyDamage([workflow.token.document], roll.total, 'none');
    await workflowUtils.bonusDamage(workflow, String(roll.total * 2), {damageType: 'healing'});
}
export const lifeTransference = {
    name: 'Life Transference',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {pass: 'itemDamageRollComplete', macro: transfer, priority: 50}
    ]
};
