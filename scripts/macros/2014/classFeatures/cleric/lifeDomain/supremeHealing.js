import {itemUtils, rollUtils, workflowUtils} from '../../../../../utils.js';
async function heal({trigger, workflow}) {
    if (!workflow.targets.size || !workflow.item || !workflow.damageRolls) return;
    if (!(workflow.item.type === 'spell' || workflow.item.system.type?.value === 'spellfeature')) return;
    let castData = workflow.castData ?? itemUtils.getSavedCastData(workflow.item);
    if (!castData?.castLevel) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('healing')) return;
    let damageRolls = await Promise.all(workflow.damageRolls.map(async i => {
        if (i.options.type != 'healing') return i;
        let roll = await i.reroll({maximize: true});
        return roll;
    }));
    await workflow.setDamageRolls(damageRolls);
    await workflowUtils.completeItemUse(trigger.entity);
}
export let supremeHealing = {
    name: 'Supreme Healing',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: heal,
                priority: 350
            }
        ]
    }
};