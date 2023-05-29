import {chris} from '../../../helperFunctions.js';
export async function bite({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let saveResult = workflow.saveResults[0].total;
    let saveDC = workflow.item.system.save.dc;
    if (saveDC - saveResult < 5) return;
    let targetActor = workflow.targets.first().actor;
    let effect = chris.findEffect(targetActor, 'Poisoned Bite');
    let roll = await new Roll('1d10').roll({async: true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: workflow.item.name
    });
    let seconds = roll.total * 60;
    let updates = {
        'duration': {
            'seconds': seconds
        }
    };
    await chris.updateEffect(effect, updates);
    await chris.addCondition(targetActor, 'Unconscious', false, workflow.item.uuid);
}