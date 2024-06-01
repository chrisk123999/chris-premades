import {animationUtils, dialogUtils, itemUtils, workflowUtils} from '../../utils.js';
async function attack(workflow) {
    if (workflow.isFumble) {
        workflow.isFumble = false;
        let roll = await new Roll('-100').evaluate();
        workflow.setAttackRoll(roll);
    }
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let jb2a = animationUtils.jb2aCheck();
    if (!playAnimation || !workflow.token || !workflow.targets.size || !jb2a) return;
    let animation = 'jb2a.arrow.poison.';
    let color = jb2a === 'patreon' ? itemUtils.getConfig(workflow.item, 'color') : 'green';
    let sound = itemUtils.getConfig(workflow.item, 'sound');
    workflow.targets.forEach(i => {
        animationUtils.simpleAttack(workflow.token, i, animation + color, {sound: sound, missed: !workflow.hitTargets.has(i)});
    });
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
            value: 'playAnimation',
            label: 'CHRISPREMADES.config.playAnimation',
            type: 'checkbox',
            default: true
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.config.color',
            type: 'select',
            default: 'green',
            options: [
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.config.colors.blue',
                    patreon: true
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.config.colors.green',
                    patreon: false
                },
                {
                    value: 'pink',
                    label: 'CHRISPREMADES.config.colors.green',
                    patreon: true
                },
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.config.colors.green',
                    patreon: true
                },
                {
                    value: 'red',
                    label: 'CHRISPREMADES.config.colors.Red',
                    patreon: true
                },
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.config.colors.orange',
                    patreon: true
                }
            ]
        },
        {
            value: 'sound',
            label: 'CHRISPREMADES.config.sound',
            type: 'file',
            default: ''
        }
    ]
};