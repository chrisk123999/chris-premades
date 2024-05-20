import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function maelstromAura(token, origin) {
    let targetToken = game.canvas.tokens.get(game.combat.current.tokenId);
    if (!targetToken) return;
    if (targetToken.document.disposition === token.document.disposition) return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > 10) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Feat Features', 'Maelstrom Aura', false);
    if (!featureData) return;
    featureData.system.save.dc = chris.getSpellDC(origin);
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Maelstrom Aura');
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': token.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    let queueSetup = await queue.setup(origin.uuid, 'maelstromAura', 50);
    if (!queueSetup) return;
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
    queue.remove(origin.uuid);
}