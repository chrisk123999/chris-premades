import {chris} from '../../../../helperFunctions.js';
export async function balmOfPeace({speaker, actor, token, character, item, args}) {
    if (this.targets.size === 0) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Balm of Peace', false);
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Balm of Peace');
    let feature = new CONFIG.Item.documentClass(featureData, {parent: this.actor});
    for (let targetToken of this.targets.values()) {
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
}