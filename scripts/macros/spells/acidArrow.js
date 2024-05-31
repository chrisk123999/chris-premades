import {workflowUtils} from '../../utils.js';
async function attack(workflow) {
    if (workflow.isFumble) {
        workflow.isFumble = false;
        let roll = await new Roll('-100').evaluate();
        workflow.setAttackRoll(roll);
    }
    
}
async function damage(workflow) {
    if (workflow.hitTargets.size) return;
    let missedTargets = workflow.targets.filter(i => !workflow.hitTargets.has(i));
    workflowUtils.applyDamage(missedTargets, Math.floor(workflow.damageRoll.total / 2), workflow.defaultDamageType);
}
export let acidArrow = {
    name: 'Melf\'s Acid Arrow',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'postAttackRollComplete',
                macro: attack,
                priority: 50
            },
            {
                pass: 'postDamageRoll',
                macro: damage,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'color',
            type: 'select',
            default: 'green',
            options: [
                {
                    label: 'Green',
                    value: 'green'
                }
            ]
        }
    ]
};