import {chris} from '../../../helperFunctions.js';
import {constants} from '../../../constants.js';
export async function radiantConsumption(token, origin) {
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Race Feature Items', 'Radiant Consumption - Damage', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Radiant Consumption - Damage');
    delete featureData._id;
    let nearbyTargets = chris.findNearby(token, 10, 'all', true).map(i => i.document.uuid);
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': token.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions(nearbyTargets);
    setProperty(options, 'workflowOptions.allowIncapacitated', true);
    await MidiQOL.completeItemUse(feature, config, options);
}