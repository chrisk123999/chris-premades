import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
let position = null;
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.token || !workflow.damageRoll) return;
    let defaultDamageType = workflow.damageRolls[0].terms[0].flavor;
    if (constants.nonDamageTypes.includes(defaultDamageType)) return;
    let targetToken = workflow.targets.first();
    if (chris.getDistance(workflow.token, targetToken) > 60) return;
    let feature = chris.getItem(workflow.actor, 'Baleful Scion: Grasp of Avarice');
    if (!feature) return;
    if (feature.uuid === workflow.item.uuid) return;
    if (!feature.system.uses.value) return;
    if (!chris.perTurnCheck(feature, 'feat', 'graspOfAvarice')) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'graspOfAvarice', 250);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, constants.yesNo, 'Use ' + feature.name + '?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await chris.setTurnCheck(feature, 'feat', 'graspOfAvarice');
    await feature.update({'system.uses.value': feature.system.uses.value - 1});
    let featureData = feature.toObject();
    delete featureData._id;
    featureData.system.damage.parts = [];
    let sFeature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    await warpgate.wait(100);
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    await MidiQOL.completeItemUse(sFeature, config, options);
    let oldFormula = workflow.damageRoll._formula;
    let bonusDamageFormula = feature.system.damage.parts[0][0].replace('@prof', workflow.actor.system.attributes.prof);
    if (workflow.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
    let damageFormula = oldFormula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    position = damageRoll.terms.length - 3;
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function damageMany({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size < 2 || !workflow.token || !workflow.damageRoll) return;
    let defaultDamageType = workflow.damageRolls[0].terms[0].flavor;
    if (constants.nonDamageTypes.includes(defaultDamageType)) return;
    let feature = chris.getItem(workflow.actor, 'Baleful Scion: Grasp of Avarice');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    if (!chris.perTurnCheck(feature, 'feat', 'graspOfAvarice')) return;
    let targetTokens = Array.from(workflow.targets).filter(t => chris.getDistance(workflow.token, t) <= 60);
    if (!targetTokens.length) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'graspOfAvarice', 250);
    if (!queueSetup) return;
    let selection = await chris.selectTarget('Use ' + feature.name + '?', constants.yesNoButton, targetTokens, true, 'one');
    if (!selection.buttons) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let targetTokenUuid = selection.inputs.find(uuid => uuid);
    if (!targetTokenUuid) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await feature.update({'system.uses.value': feature.system.uses.value - 1});
    await chris.setTurnCheck(feature, 'feat', 'graspOfAvarice');
    let targetToken = await fromUuid(targetTokenUuid);
    let featureData = feature.toObject();
    delete featureData._id;
    featureData.system.damage.parts[0][1] = 'midi-none';
    featureData.system.damage.parts[0][0] = featureData.system.damage.parts[0][0].replace('[necrotic]', '');
    let sFeature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    await warpgate.wait(100);
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.uuid]);
    let sWorkflow = await MidiQOL.completeItemUse(sFeature, config, options);
    chris.addDamageDetailDamage(targetToken, sWorkflow.damageTotal, 'necrotic', workflow);
    queue.remove(workflow.item.uuid);
}
async function end(origin) {
    await chris.setTurnCheck(origin, 'feat', 'graspOfAvarice', true);
}
async function heal({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!position || !workflow.damageRoll || !workflow.targets.size) return;
    let targetToken = workflow.targets.first();
    if (chris.checkTrait(targetToken.actor, 'di', 'necrotic')) {
        position = null;
        return;
    }
    let healing = workflow.damageRoll.terms[position].total + workflow.actor.system.attributes.prof;
    if (chris.checkTrait(targetToken.actor, 'dr', 'necrotic')) healing = Math.floor(healing / 2);
    await chris.applyDamage([workflow.token], healing, 'healing');
    position = null;
}
export let graspOfAvarice = {
    'damage': damage,
    'damageMany': damageMany,
    'end': end,
    'heal': heal
}