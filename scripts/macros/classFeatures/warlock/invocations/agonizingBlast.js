import {queue} from '../../../../queue.js';
export async function agonizingBlast({speaker, actor, token, character, item, args, scope, workflow}) {
    let spellName = workflow.actor.flags['chris-premades']?.feature?.agonizingBlast?.name;
    if (!spellName) spellName = 'Eldritch Blast';
    if (workflow.item.name != spellName) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'agonizingBlast', 250);
    if (!queueSetup) return;
    let bonusDamage = Math.max(workflow.actor.system.abilities.cha.mod, 0);
    let damageFormula = workflow.damageRoll._formula + ' + ' + bonusDamage + '[force]';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}