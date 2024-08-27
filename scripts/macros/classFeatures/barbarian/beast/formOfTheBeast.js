import {combatUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!Math.floor(workflow.damageList[0].damageDetail.reduce((acc, i) => acc + i.value, 0))) return;
    if (!combatUtils.perTurnCheck(workflow.item, 'formOfTheBeastBite', true, workflow.token.id)) return;
    let maxHP = workflow.actor.system.attributes.hp.max;
    let currHP = workflow.actor.system.attributes.hp.value;
    if (Math.ceil(maxHP / 2) <= currHP) return;
    await workflowUtils.applyDamage([workflow.token], workflow.actor.system.attributes.prof, 'healing');
    await combatUtils.setTurnCheck(workflow.item, 'formOfTheBeastBite');
}
export let formOfTheBeast = {
    name: 'Form of the Beast',
    version: '0.12.20',
    ddbi: {
        removedItems: {
            'Form of the Beast': [
                'Form of the Beast: Bite',
                'Form of the Beast: Claws',
                'Form of the Beast: Tail',
                'Form of the Beast: Tail (reaction)'
            ]
        }
    }
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