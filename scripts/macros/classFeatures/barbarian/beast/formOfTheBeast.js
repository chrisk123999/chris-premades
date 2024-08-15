import {combatUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!workflow.damageList[0].appliedDamage) return;
    if (!combatUtils.perTurnCheck(workflow.item, 'formOfTheBeastBite', true, workflow.token.id)) return;
    let maxHP = workflow.actor.system.attributes.hp.max;
    let currHP = workflow.actor.system.attributes.hp.value;
    if (Math.ceil(maxHP / 2) <= currHP) return;
    await workflowUtils.applyDamage([workflow.token], workflow.actor.system.attributes.prof, 'healing');
    await combatUtils.setTurnCheck(workflow.item, 'formOfTheBeastBite');
}
export let formOfTheBeast = {
    name: 'Form of the Beast',
    version: '0.12.15'
};
export let formOfTheBeastBite = {
    name: 'Form of the Beast: Bite',
    version: formOfTheBeast.version,
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