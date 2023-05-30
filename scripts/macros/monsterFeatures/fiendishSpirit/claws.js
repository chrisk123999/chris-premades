import {chris} from '../../../helperFunctions.js';
export async function claws({speaker, actor, token, character, item, args, scope, workflow}) {
    let selection = await chris.dialog('Use teleportation?', [['Yes', true], ['No', false]]);
    if (!selection) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Claws (Yugoloth Only) - Teleport', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Claws (Yugoloth Only) - Teleport');
    let feature = new CONFIG.Item.documentClass(featureData, {parent: workflow.actor});
    await feature.use();
}