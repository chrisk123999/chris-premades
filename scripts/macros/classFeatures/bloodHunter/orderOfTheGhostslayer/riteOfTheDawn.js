import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
export async function riteOfTheDawn(workflow) {
    let hasFeature = workflow.item.flags['chris-premades']?.feature?.rotd;
    if (!hasFeature) return;
    if (workflow.hitTargets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let targetType = chris.raceOrType(targetActor);
    if (targetType != 'undead') return;
    let damageDice = workflow.actor.system.scale['blood-hunter']['crimson-rite'];
    if (!damageDice) {
        ui.notifications.warn('Source actor does not appear to have a Crimson Rite scale!');
        return;
    }
    let queueSetup = await queue.setup(workflow.item.uuid, 'riteOfTheDawn', 250);
    if (!queueSetup) return;
    if (workflow.isCritical) damageDice = 2 + damageDice.substring(1);
    let damageFormula = workflow.damageRoll._formula + ' + ' + damageDice + '[radiant]';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}