import {documentUtils, workflowUtils} from '../../../proxy.mjs';
function preambleComplete({document: item, workflow}) {
    if (workflow.item?.type !== 'weapon' || workflow.activity?.attack?.type?.classification !== 'unarmed') return;
    let formula = Roll.replaceFormulaData(workflow.item.system.damage.base.formula, {...workflow.item.getRollData(), mod: '@mod'});
    if (!/\d*d\d+/i.test(formula)) formula = '1d4';
    if (documentUtils.getRules(item) === '2024') formula = formula.replace(/(\d*d\d+)(?![a-z])/gi, '$1r1');
    workflowUtils.setItem(workflow, workflow.item.clone({'system.damage.base.custom': {enabled: true, formula}}, {keepId: true}));
}
export const tavernBrawler = {
    name: 'Tavern Brawler',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: preambleComplete,
            priority: 50
        }
    ]
};
