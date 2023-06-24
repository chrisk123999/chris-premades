import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
async function hook(workflow) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first().document;
    if (!targetToken) return;
    let sourceToken = workflow.token.document;
    let targetActor = targetToken.actor;
    let sourceActor = sourceToken.actor;
    let targetEffect = chris.findEffect(targetActor, 'Shadow of Moil');
    let sourceEffect = chris.findEffect(sourceActor, 'Shadow of Moil');
    if (!targetEffect && !sourceEffect) return;
    let distance = chris.getDistance(sourceToken, targetToken);
    let sourceCanSeeTarget = false;
    let targetCanSeeSource = false;
    if (sourceEffect) sourceCanSeeTarget = true;
    if (targetEffect) targetCanSeeSource = true;
    if (sourceEffect && targetEffect) {
        sourceCanSeeTarget = false;
        targetCanSeeSource = false;
    }
    let sourceSenses = sourceToken.actor.system.attributes.senses;
    let targetSenses = targetToken.actor.system.attributes.senses;
    if ((sourceSenses.tremorsense >= distance) || (sourceSenses.blindsight >= distance)) sourceCanSeeTarget = true;
    if ((targetSenses.tremorsense >= distance) || (targetSenses.blindsight >= distance)) targetCanSeeSource = true;
    if (sourceCanSeeTarget && targetCanSeeSource) return;
    if (sourceCanSeeTarget && !targetCanSeeSource) {
        workflow.advantage = true;
        workflow.attackAdvAttribution.add('Shadow of Moil: Target Can\'t See Source');
    }
    if (!sourceCanSeeTarget && targetCanSeeSource) {
        workflow.disadvantage = true;
        workflow.flankingAdvantage = false;
        workflow.attackAdvAttribution.add('Shadow of Moil: Source Can\'t See Target');
    }
    if (!sourceCanSeeTarget && !targetCanSeeSource) {
        workflow.advantage = true;
        workflow.disadvantage = true;
        workflow.attackAdvAttribution.add('Shadow of Moil: Target And Source Can\'t See Eachother');
    }
    console.log(workflow);
}
async function onHit(workflow, targetToken) {
    if (workflow.hitTargets.size === 0) return;
    let validTypes = ['msak', 'rsak', 'mwak', 'rwak'];
    if (!validTypes.includes(workflow.item.system.actionType)) return;
    let distance = chris.getDistance(workflow.token, targetToken);
    if (distance > 10) return;
    let targetActor = targetToken.actor;
    let effect = chris.findEffect(targetActor, 'Shadow of Moil');
    if (!effect) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Shadow of Moil Damage', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Shadow of Moil Damage');
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    if (!feature) return;
    let options = constants.syntheticItemWorkflowOptions([workflow.token.document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, {}, options);
}
export let shadowOfMoil = {
    'hook': hook,
    'onHit': onHit,
}