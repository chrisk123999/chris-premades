import {chris} from '../../../helperFunctions.js';
export async function engulf(origin, token, actor) {
    let sourceTokenId = actor.flags['chris-premades']?.monster?.shamblingMound?.engulf
    if (!sourceTokenId) return;
    if (game.combat.current.tokenId != sourceTokenId) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Monster Feature Items', 'Shambling Mound - Engulf', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Shambling Mound - Engulf');
    featureData.system.damage.parts = [
        [
            '2d8[bludgeoning]',
            'bludgeoning'
        ]
    ];
    featureData.system.save.dc = chris.getSpellDC(origin);
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [token.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    let feature = new CONFIG.Item.documentClass(featureData, {parent: origin.actor});
    await MidiQOL.completeItemUse(feature, {}, options);
}