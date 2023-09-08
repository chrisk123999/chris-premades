import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function extraDamage(workflow) {
    let damageFormula = workflow.damageRoll._formula;
    let scale = workflow.actor.system.scale?.ranger?.['favored-foe']?.formula;
    if (!scale) return;
    let bonusDamageFormula = scale + '[' + workflow.defaultDamageType + ']';
    if (workflow.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
    let damageRoll = await new Roll(damageFormula + ' + ' + bonusDamageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
}
export async function favoredFoe({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let originItem = chris.getItem(workflow.actor, 'Favored Foe');
    if (!originItem) return;
    let uses = originItem.system.uses.value;
    if (uses === 0) return;
    let targetToken = workflow.targets.first();
    let effect = targetToken.actor.effects.find(e => e.label === 'Favored Foe' && e.origin === originItem.uuid);
    let queueSetup = await queue.setup(workflow.item.uuidk, 'favoredFoe', 250);
    if (!queueSetup) return;
    if (effect) {
        await extraDamage(workflow);
        queue.remove(workflow.item.uuid);
        return;
    }
    let selection = await chris.dialog(originItem.name, [['Yes,', true], ['No', false]], 'Use Favored Foe?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(originItem, config, options);
    await originItem.update({'system.uses.value': uses - 1});
    await extraDamage(workflow);
    queue.remove(workflow.item.uuid);
}