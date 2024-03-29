import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
export async function balmOfPeace({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size === 0) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Balm of Peace', false);
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Balm of Peace');
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([]);
    for (let targetToken of workflow.targets.values()) {
        options.targetUuids = [targetToken.document.uuid];
        await MidiQOL.completeItemUse(feature, config, options);
    }
}