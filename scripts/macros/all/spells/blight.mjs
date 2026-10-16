import {actorUtils, documentUtils, rollUtils, workflowUtils} from '../../../proxy.mjs';
function plants(workflow) {
    return Array.from(workflow.targets).filter(token => actorUtils.typeOrRace(token.actor) === 'plant');
}
function wither({workflow}) {
    const mode = documentUtils.getRules(workflow.item) === '2024' ? 'fail' : 'dis';
    plants(workflow).forEach(token => workflowUtils.grantRollModifier(workflow, mode, token.id, 'blight', workflow.item.name));
}
async function maximize({workflow}) {
    if (documentUtils.getRules(workflow.item) === '2024' || workflow.targets.size !== 1 || !plants(workflow).length) return;
    const rolls = await Promise.all(workflow.damageRolls.map(rollUtils.maximizeRoll));
    await workflow.setDamageRolls(rolls);
}
export const blight = {
    name: 'Blight',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'itemPreambleComplete', macro: wither, priority: 60},
        {pass: 'itemDamageRoll', macro: maximize, priority: 50}
    ]
};
