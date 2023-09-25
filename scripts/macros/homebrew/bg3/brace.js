import {queue} from '../../../utility/queue.js';
export async function brace({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let validTypes = [
        'glaive',
        'heavycrossbow',
        'longbow',
        'pike',
        'dart'
    ];
    if (!validTypes.includes(workflow.item.system.baseItem)) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'brace', 350);
    if (!queueSetup) return;
    let damageFormula = 'max(' + workflow.damageRoll._formula + ', ' + workflow.damageRoll._formula + ')';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}