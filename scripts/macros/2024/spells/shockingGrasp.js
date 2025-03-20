import {actorUtils, animationUtils, effectUtils, itemUtils} from '../../../utils.js';
import {shockingGrasp as shockingGraspLegacy} from '../../../legacyMacros.js';

async function use({workflow}) {
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
    version: '1.2.29',
    rules: 'modern',
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
    config: shockingGraspLegacy.config
};