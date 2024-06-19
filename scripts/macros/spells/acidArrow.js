import {animationUtils, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
async function early({trigger, workflow}) {
    genericUtils.setProperty(workflow, 'workflowOptions.autoRollDamage', 'always');
}
async function attack({trigger, workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let jb2a = animationUtils.jb2aCheck();
    if (!playAnimation || !workflow.token || !workflow.targets.size || !jb2a) return;
    let animation = 'jb2a.arrow.poison.';
    let color = jb2a === 'patreon' ? itemUtils.getConfig(workflow.item, 'color') : 'green';
    if (color === 'random') {
        let colors = ['blue', 'green', 'pink', 'purple', 'red', 'orange'];
        color = colors[Math.floor((Math.random() * colors.length))];
    }
    let sound = itemUtils.getConfig(workflow.item, 'sound');
    workflow.targets.forEach(i => {
        animationUtils.simpleAttack(workflow.token, i, animation + color, {sound: sound, missed: !workflow.hitTargets.has(i)});
    });
}
async function damage({trigger, workflow}) {
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
                pass: 'preItemRoll',
                macro: early,
                priority: 50
            },
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
            default: true,
            category: 'animation'
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.config.color',
            type: 'select',
            default: 'green',
            category: 'animation',
            options: [
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.config.colors.blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.config.colors.green'
                },
                {
                    value: 'pink',
                    label: 'CHRISPREMADES.config.colors.green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.config.colors.green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'red',
                    label: 'CHRISPREMADES.config.colors.Red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.config.colors.orange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'random',
                    label: 'CHRISPREMADES.config.colors.random',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'sound',
            label: 'CHRISPREMADES.config.sound',
            type: 'file',
            default: '',
            category: 'animation'
        }
    ]
};