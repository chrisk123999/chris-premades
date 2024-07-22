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
    version: '0.12.0',
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
            label: 'CHRISPREMADES.config.playAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.config.color',
            type: 'select',
            default: 'blue',
            category: 'animation',
            options: [
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.config.colors.blue'
                },
                {
                    value: 'blue02',
                    label: 'CHRISPREMADES.config.colors.blue02',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_purple',
                    label: 'CHRISPREMADES.config.colors.dark_purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_red',
                    label: 'CHRISPREMADES.config.colors.darkRed',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.config.colors.green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green02',
                    label: 'CHRISPREMADES.config.colors.green02',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.config.colors.orange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.config.colors.purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'red',
                    label: 'CHRISPREMADES.config.colors.red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'yellow',
                    label: 'CHRISPREMADES.config.colors.yellow',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'random',
                    label: 'CHRISPREMADES.config.colors.random',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        }
    ]
};