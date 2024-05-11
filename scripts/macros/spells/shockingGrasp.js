import {chris} from '../../helperFunctions.js';
export async function shockingGrasp({speaker, actor, token, character, item, args, scope, workflow}) {
    let targetToken = workflow.targets.first();
    if (workflow.hitTargets.size) {
        let effect = chris.findEffect(targetToken.actor, 'Reaction');
        if (!effect) await chris.addCondition(targetToken.actor, 'Reaction', false, workflow.item.uuid);
    }
    let color = chris.getConfiguration(workflow.item, 'color') ?? 'blue';
    if (color === 'none') return;
    if (chris.jb2aCheck() != 'patreon') color = 'blue';
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
    if (color === 'random') {
        color = colors[Math.floor(Math.random() * colors.length)];
    }
    //Animations by: eskiemoh
    new Sequence()
        .effect()
        .file('jb2a.static_electricity.01.' + color)
        .scaleToObject(1.2) 
        .atLocation(targetToken)
        .waitUntilFinished(-1000)

        .effect()
        .file('jb2a.impact.011.' + color)
        .scaleToObject(1.9) 
        .atLocation(targetToken)

        .play();
}