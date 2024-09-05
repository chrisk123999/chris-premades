import {itemUtils, rollUtils, workflowUtils} from '../../../../utils.js';
async function heal({trigger, workflow}) {
    if (!workflow.targets.size || !workflow.item || !workflow.damageRolls) return;
    if (!(workflow.item.type === 'spell' || workflow.item.system.type?.value === 'spellfeature')) return;
    let castData = workflow.castData ?? itemUtils.getSavedCastData(workflow.item);
    if (!castData?.castLevel) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('healing')) return;
    let damageRolls = await Promise.all(workflow.damageRolls.map(async i => {
        console.log(i);
        if (i.options.type != 'healing') return i;
        console.log('here');
        let roll = await i.reroll({maximize: true});
        //let roll = await rollUtils.damageRoll(i.formula, workflow.actor, {maximize: true, type: 'healing'});
        console.log(roll);
        return roll;
    }));
    console.log(damageRolls);
    await workflow.setDamageRolls(damageRolls);
    console.log(workflow.damageRolls);
    await trigger.entity.use();
}
export let supremeHealing = {
    name: 'Supreme Healing',
    version: '0.12.54',
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