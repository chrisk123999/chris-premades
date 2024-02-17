import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {translate} from '../../translations.js';
import {queue} from '../../utility/queue.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.token || !workflow.damageRoll) return;
    let defaultDamageType = workflow.damageRolls[0].terms[0].flavor;
    if (constants.nonDamageTypes.includes(defaultDamageType)) return;
    let targetToken = workflow.targets.first();
    if (chris.getDistance(workflow.token, targetToken) > 60) return;
    let feature = chris.getItem(workflow.actor, 'Agent of Order: Stasis Strike');
    if (!feature) return;
    if (feature.uuid === workflow.item.uuid) return;
    if (!feature.system.uses.value) return;
    if (!chris.perTurnCheck(feature, 'feat', 'stasisStrike')) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'stasisStrike', 250);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, constants.yesNo, 'Use ' + feature.name + '?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await chris.setTurnCheck(feature, 'feat', 'stasisStrike');
    await feature.update({'system.uses.value': feature.system.uses.value - 1});
    let featureData = feature.toObject();
    delete featureData._id;
    featureData.system.damage.parts = [];
    let sFeature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    await warpgate.wait(100);
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    await MidiQOL.completeItemUse(sFeature, config, options);
    let oldFormula = workflow.damageRoll._formula;
    let bonusDamageFormula = feature.system.damage.parts[0][0] + '[' + translate.damageType('force') + ']';
    if (workflow.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
    let damageFormula = oldFormula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function damageMany({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size < 2 || !workflow.token || !workflow.damageRoll) return;
    let defaultDamageType = workflow.damageRolls[0].terms[0].flavor;
    if (constants.nonDamageTypes.includes(defaultDamageType)) return;
    let feature = chris.getItem(workflow.actor, 'Agent of Order: Stasis Strike');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    if (!chris.perTurnCheck(feature, 'feat', 'stasisStrike')) return;
    let targetTokens = Array.from(workflow.targets).filter(t => chris.getDistance(workflow.token, t) <= 60);
    if (!targetTokens.length) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'stasisStrike', 250);
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
    await chris.setTurnCheck(feature, 'feat', 'stasisStrike');
    let targetToken = await fromUuid(targetTokenUuid);
    let featureData = feature.toObject();
    delete featureData._id;
    featureData.system.damage.parts[0][1] = 'midi-none';
    let sFeature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    await warpgate.wait(100);
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.uuid]);
    let sWorkflow = await MidiQOL.completeItemUse(sFeature, config, options);
    chris.addDamageDetailDamage(targetToken, sWorkflow.damageTotal, 'force', workflow);
    queue.remove(workflow.item.uuid);
}
async function end(origin) {
    await chris.setTurnCheck(origin, 'feat', 'stasisStrike', true);
}
export let stasisStrike = {
    'damage': damage,
    'damageMany': damageMany,
    'end': end
}