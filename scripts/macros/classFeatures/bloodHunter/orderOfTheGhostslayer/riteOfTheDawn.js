import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
export async function riteOfTheDawn({speaker, actor, token, character, item, args}) {
    let hasFeature = this.item.flags['chris-premades']?.feature?.rotd;
    if (!hasFeature) return;
    if (this.hitTargets.size != 1) return;
    let targetToken = this.targets.first();
    let targetActor = targetToken.actor;
    let targetType = chris.raceOrType(targetActor);
    if (targetType != 'undead') return;
    let damageDice = this.actor.system.scale['blood-hunter']['crimson-rite'];
    if (!damageDice) {
        ui.notifications.warn('Source actor does not appear to have a Crimson Rite scale!');
        return;
    }
    let queueSetup = await queue.setup(this.item.uuid, 'riteOfTheDawn', 250);
    if (!queueSetup) return;
    let bonusDamageFormula = damageDice.formula + '[radiant]';
    if (this.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
    let damageFormula = this.damageRoll._formula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}