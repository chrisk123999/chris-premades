import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let color = chris.getConfiguration(workflow.item, 'color') ?? 'purple';
    if (color === 'none') return;
    let colors = [
        'dark_green',
        'dark_red',
        'green',
        'lightblue',
        'lightgreen',
        'orange',
        'pink',
        'rainbow',
        'yellow',
        'purple'
    ]
    if (color === 'cycle') {
        let lastColor = workflow.item.flags['chris-premades']?.spell?.eldritchBlast?.lastColor ?? Math.floor(Math.random() * colors.length);
        color = colors[lastColor];
        lastColor += 1;
        if (lastColor >= colors.length) lastColor = 0;
        await workflow.item.setFlag('chris-premades', 'spell.eldritchBlast.lastColor', lastColor);
    } else if (color === 'random') {
        color = colors[Math.floor(Math.random() * colors.length)];
    }
    let animation = 'jb2a.eldritch_blast.' + color;
    new Sequence().effect().atLocation(workflow.token).stretchTo(workflow.targets.first()).file(animation).missed(workflow.hitTargets.size === 0).play();
}
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.damageRoll) return;
    let agonizingBlast = workflow.actor.flags['chris-premades']?.feature?.agonizingBlast ?? chris.getConfiguration(workflow.item, 'agonizingblast');
    if (!agonizingBlast) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'agonizingBlast', 50);
    if (!queueSetup) return;
    let bonusDamage = Math.max(workflow.actor.system.abilities.cha.mod, 0);
    let damageFormula = workflow.damageRoll._formula + ' + ' + bonusDamage;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
export let eldritchBlast = {
    'item': item,
    'damage': damage
}