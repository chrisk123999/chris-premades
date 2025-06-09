import {genericUtils} from '../../../../../utils.js';

async function updateScales(origItem, newItemData) {
    let { scaleIdentifier=null } = genericUtils.getValidScaleIdentifier(origItem.actor, newItemData, psionicEnergy.scaleAliases, 'soulknife');
    if (!scaleIdentifier) return;
    genericUtils.setProperty(newItemData, 'system.activities.dnd5eactivity000.damage.parts.0.custom.formula', '@scale.soulknife.' + scaleIdentifier);
}
export let psionicEnergy = {
    name: 'Psionic Power: Psionic Energy',
    aliases: ['Psionic Power'],
    version: '1.1.0',
    scaleAliases: ['psionic-power', 'die'],
    early: updateScales
};