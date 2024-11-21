import {actorUtils, animationUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    for (let target of workflow.hitTargets) {
        actorUtils.setReactionUsed(target.actor);
    }
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (!playAnimation || !animationUtils.jb2aCheck()) return;
    let color = itemUtils.getConfig(workflow.item, 'color');
    let colors = [
        'blue',
        'blue02',
        'dark_purple',
        'dark_red',
        'green',
        'green02',
        'orange',
        'purple',
        'red',
        'yellow'
    ];
    for (let targetToken of workflow.targets) {
        let currColor = color;
        if (currColor === 'random') currColor = colors[Math.floor(Math.random() * colors.length)];
        //Animations by: eskiemoh
        new Sequence()
            .effect()
            .file('jb2a.static_electricity.01.' + currColor)
            .scaleToObject(1.2) 
            .atLocation(targetToken)
            .waitUntilFinished(-1000)

            .effect()
            .file('jb2a.impact.011.' + currColor)
            .scaleToObject(1.9) 
            .atLocation(targetToken)

            .play();
    }
}
export let shockingGrasp = {
    name: 'Shocking Grasp',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
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
            default: 'blue',
            category: 'animation',
            options: [
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue'
                },
                {
                    value: 'blue02',
                    label: 'CHRISPREMADES.Config.Colors.Blue02',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_purple',
                    label: 'CHRISPREMADES.Config.Colors.DarkPurple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_red',
                    label: 'CHRISPREMADES.Config.Colors.DarkRed',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green02',
                    label: 'CHRISPREMADES.Config.Colors.Green02',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.Config.Colors.Orange',
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
                    value: 'yellow',
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'random',
                    label: 'CHRISPREMADES.Config.Colors.Random',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        }
    ]
};