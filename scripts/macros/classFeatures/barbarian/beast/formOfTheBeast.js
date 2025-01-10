import {activityUtils, combatUtils, workflowUtils} from '../../../../utils.js';

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
    version: '1.1.10',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['formOfTheBeastBite']
            }
        ]
    },
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