import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js'

async function runFeature(workflow, featureName) {
    if (workflow.hitTargets.size != 1 || workflow.item.system.baseItem != 'firearmCR') return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', featureName, false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription(featureName);
    let originItem = chris.getItem(workflow.actor, featureName);
    if (!originItem) return;
    featureData._id = originItem.id;
    featureData.system.save.dc = chris.getSpellDC(originItem);
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await warpgate.wait(100);
    return await MidiQOL.completeItemUse(feature, config, options);
}
async function wingingShot({speaker, actor, token, character, item, args, scope, workflow}) {
    await runFeature(workflow, 'Winging Shot');
}
async function forcefulShot({speaker, actor, token, character, item, args, scope, workflow}) {
    let featureWorkflow = await runFeature(workflow, 'Forceful Shot');
    if (featureWorkflow.failedSaves.size != 1) return;
    await chris.pushToken(workflow.token, workflow.targets.first(), 15);
}
async function disarmingShot({speaker, actor, token, character, item, args, scope, workflow}) {
    await runFeature(workflow, 'Disarming Shot');
}
async function dazingShot({speaker, actor, token, character, item, args, scope, workflow}) {
    await runFeature(workflow, 'Dazing Shot');
}
export let trickShots = {
    'wingingShot': wingingShot,
    'forcefulShot': forcefulShot,
    'disarmingShot':disarmingShot,
    'dazingShot': dazingShot
}