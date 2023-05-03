import {chris} from '../../../helperFunctions.js';
export async function rottingClaw({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetToken = this.targets.first();
    let effect = chris.findEffect(targetToken.actor, 'Poisoned');
    if (!effect) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Rotting Claw (Putrid Only) - Paralyze', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Rotting Claw (Putrid Only) - Paralyze');
    let spellDC = this.item.flags['chris-premades']?.feature?.rottingClaw?.dc;
    if (!spellDC) return;
    featureData.system.save.dc = spellDC;
    let feature = new CONFIG.Item.documentClass(featureData, {parent: this.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetToken.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
    await MidiQOL.completeItemUse(feature, {}, options);
}