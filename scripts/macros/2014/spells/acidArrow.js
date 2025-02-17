import {animationUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
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
    version: '1.1.10',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'preItemRoll',
                macro: early,
                priority: 50
            },
            {
                pass: 'attackRollComplete',
                macro: attack,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.Config.Color',
            type: 'select',
            default: 'green',
            category: 'animation',
            options: [
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.Config.Colors.Green'
                },
                {
                    value: 'pink',
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'red',
                    label: 'CHRISPREMADES.Config.Colors.Red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.Config.Colors.Orange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'random',
                    label: 'CHRISPREMADES.Config.Colors.Random',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'sound',
            label: 'CHRISPREMADES.Config.Sound',
            type: 'file',
            default: '',
            category: 'animation'
        }
    ]
};