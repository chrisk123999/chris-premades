import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
export async function eldritchSmite({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.item.type != 'weapon') return;
    let validTypes = ['martialM', 'simpleM'];
    if (!validTypes.includes(workflow.item.system.weaponType)) return;
    let pactSlots = workflow.actor.system.spells.pact.value;
    if (pactSlots === 0) return;
    let pactLevel = workflow.actor.system.spells.pact.level;
    let queueSetup = await queue.setup(workflow.item.uuid, 'eldritchSmite', 250);
    if (!queueSetup) return;
    let selection = await chris.dialog('Use Eldritch Smite?', [['Yes', true], ['No', false]]);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let updates = {
        'system.spells.pact.value': pactSlots - 1
    }
    await workflow.actor.update(updates);
    let bonusDamage = (1 + pactLevel) + 'd8[force]';
    if (workflow.isCritical) bonusDamage = chris.getCriticalFormula(bonusDamage);
    let damageFormula = workflow.damageRoll._formula + ' + ' + bonusDamage;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    let effect = chris.findEffect(workflow.actor, 'Eldritch Smite');
    if (effect) {
        let originItem = await fromUuid(effect.origin);
        if (originItem) await originItem.use();
    }
    let targetActor = workflow.targets.first().actor;
    let targetSize = chris.getSize(targetActor, false);
    let effect2 = chris.findEffect(targetActor, 'Prone');
    if (targetSize > 4 || effect2) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let selection2 = await chris.dialog('Knock target prone?', [['Yes', true], ['No', false]]);
    if (!selection2 || chris.checkTrait(targetActor, 'ci', 'prone')) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await chris.addCondition(targetActor, 'Prone', false, null);
}
