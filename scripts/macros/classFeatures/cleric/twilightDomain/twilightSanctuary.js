import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function turnStart(token, origin) {
    let targetTokenId = game.combat.previous.tokenId;
    if (!targetTokenId) return;
    let targetToken = canvas.scene.tokens.get(targetTokenId);
    if (!targetToken) return;
    if (targetToken.disposition != token.document.disposition) return;
    let distance = await chris.getDistance(token, targetToken);
    if (distance > 30) return;
    let charmedEffect = chris.findEffect(targetToken.actor, 'Charmed');
    let frightenedEffect = chris.findEffect(targetToken.actor, 'Frightened');
    let classLevels = origin.actor.classes.cleric?.system?.levels ?? 0;
    let formula = '1d6[temphp] + ' + classLevels;
    let generatedMenu = [['Gain 1d6 + ' + classLevels + ' temporary HP', 'hp']];
    if (charmedEffect) generatedMenu.push(['Remove the charmed condition', 'Charmed']);
    if (frightenedEffect) generatedMenu.push(['Remove the frightened condition', 'Frightened']);
    generatedMenu.push(['None', false]);
    let ownerId = chris.firstOwner(targetToken).id;
    let selection = await chris.remoteDialog(origin.name, generatedMenu, ownerId, 'What would you like to do?');
    if (!selection) return;
    switch (selection) {
        case 'hp':
            let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Twilight Sanctuary - Temporary HP', false);
            if (!featureData) return;
            delete featureData._id;
            featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Twilight Sanctuary - Temporary HP');
            featureData.system.damage.parts[0][0] = formula;
            let feature = new CONFIG.Item.documentClass(featureData, {'parent': token.actor});
            let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.uuid]);
            let queueSetup = await queue.setup(origin.uuid, 'twilightSanctuary', 50);
            if (!queueSetup) return;
            await warpgate.wait(100);
            await MidiQOL.completeItemUse(feature, config, options);
            queue.remove(origin.uuid);
            break;
        case 'Charmed':
        case 'Frightened':
            await chris.removeCondition(targetToken.actor, selection);
            break;
    }
}
export let twilightSanctuary = {
    'turnStart': turnStart
}