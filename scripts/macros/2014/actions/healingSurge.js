import {workflowUtils} from '../../../utils.js';
async function heal({trigger, workflow}) {
    let formula = '';
    for (let i of Object.entries(workflow.dnd5eFlags.use.consumed.item)) {
        let item = workflow.actor.items.get(i[0]);
        if (item?.type != 'class') continue;
        if (formula.length) formula += ' + ';
        formula += i[1][0].delta + item.system.hd.denomination;
    }
    await workflowUtils.replaceDamage(workflow, formula);
}
export let healingSurge = {
    name: 'Healing Surge',
    version: '1.3.122',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: heal,
                priority: 50
            }
        ]
    }
};