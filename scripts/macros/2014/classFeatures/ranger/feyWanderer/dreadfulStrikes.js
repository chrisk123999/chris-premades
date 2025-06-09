import {genericUtils} from '../../../../../utils.js';

async function updateScales(origItem, newItemData) {
    let { scaleIdentifier=null } = genericUtils.getValidScaleIdentifier(origItem.actor, newItemData, dreadfulStrikes.scaleAliases, 'fey-wanderer');
    if (!scaleIdentifier) return;
    genericUtils.setProperty(newItemData, 'effects.0.changes.0.value', `@scale.fey-wanderer.${scaleIdentifier}[psychic]`);
    genericUtils.setProperty(newItemData, 'effects.0.changes.1.value', `@scale.fey-wanderer.${scaleIdentifier}[psychic]`);
}
export let dreadfulStrikes = {
    name: 'Dreadful Strikes',
    version: '1.1.0',
    scaleAliases: ['dreadful-strikes', 'die'],
    early: updateScales
};