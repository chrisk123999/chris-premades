import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
export async function rottingClaw({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let effect = chris.findEffect(targetToken.actor, 'Poisoned');
    if (!effect) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Rotting Claw (Putrid Only) - Paralyze', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Rotting Claw (Putrid Only) - Paralyze');
    let spellDC = workflow.item.flags['chris-premades']?.feature?.rottingClaw?.dc;
    if (!spellDC) return;
    featureData.system.save.dc = spellDC;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let options = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    await MidiQOL.completeItemUse(feature, {}, options);
}