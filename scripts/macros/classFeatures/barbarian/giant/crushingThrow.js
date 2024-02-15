import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function crushingThrow({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.item.system.properties.has('thr')) return;
    if (!(workflow.item.system.ability === '' || workflow.item.system.ability === 'str')) return;
    let isFin = workflow.item.system.properties.has('fin') && workflow.item.system.ability === '';
    if (isFin && workflow.actor.system.abilities.dex.mod > workflow.actor.system.abilities.str.mod) return;
    let distance = chris.getDistance(workflow.token, workflow.targets.first());
    let demiurgicColossus = chris.getItem(workflow.actor, 'Demiurgic Colossus');
    if (distance <= (demiurgicColossus ? 15 : 10)) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'crushingThrow', 250);
    if (!queueSetup) return;
    let bonusDamageFormula = workflow.actor.system.scale.barbarian?.['rage-damage']?.value;
    if (!bonusDamageFormula) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let oldFormula = workflow.damageRoll._formula;
    if (workflow.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
    let damageFormula = oldFormula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    let feature = chris.getItem(workflow.actor, 'Giant\'s Havoc: Crushing Throw');
    if (feature) await feature.displayCard();
    queue.remove(workflow.item.uuid);
}