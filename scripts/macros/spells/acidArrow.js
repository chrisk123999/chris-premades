import {dialogUtils, itemUtils, workflowUtils} from '../../utils.js';
async function attack(workflow) {
    if (workflow.isFumble) {
        workflow.isFumble = false;
        let roll = await new Roll('-100').evaluate();
        workflow.setAttackRoll(roll);
    }
    if (itemUtils.getConfig(workflow.item, 'playAnimation')) return;
    let color = itemUtils.getConfig(workflow.item, 'color');
    let sound = itemUtils.getConfig(workflow.item, 'sound');
    //here
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
                    label: 'Blue',
                    value: 'CHRISPREMADES.colors.blue',
                    patreon: true
                },
                {
                    label: 'Green',
                    value: 'CHRISPREMADES.colors.green',
                    patreon: true
                },
                {
                    label: 'Pink',
                    value: 'CHRISPREMADES.colors.green',
                    patreon: true
                },
                {
                    label: 'Purple',
                    value: 'CHRISPREMADES.colors.green',
                    patreon: true
                },
                {
                    label: 'Red',
                    value: 'CHRISPREMADES.colors.Red',
                    patreon: true
                },
                {
                    label: 'Orange',
                    value: 'CHRISPREMADES.colors.orange',
                    patreon: true
                }
            ]
        },
        {
            value: 'playAnimation',
            type: 'checkbox'
        }
    ]
};