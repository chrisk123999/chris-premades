import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function wrathOfTheStorm({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'wrathOfTheStorm', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog('What damage type?', [['Lightning', '[lightning]'], ['Thunder', '[thunder]']]);
    if (!selection) selection = 'lightning';
    let damageFormula = workflow.damageRoll._formula + selection;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}