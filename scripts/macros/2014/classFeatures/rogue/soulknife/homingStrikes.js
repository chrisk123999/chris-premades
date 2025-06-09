import {genericUtils} from '../../../../../utils.js';
import {psionicEnergy} from './psionicEnergy.js';

async function updateScales(origItem, newItemData) {
    let { scaleIdentifier=null } = genericUtils.getValidScaleIdentifier(origItem.actor, newItemData, psionicEnergy.scaleAliases, 'soulknife');
    if (!scaleIdentifier) return;
    genericUtils.setProperty(newItemData, 'system.activities.dnd5eactivity000.damage.parts.0.custom.formula', '@scale.soulknife.' + scaleIdentifier);
}
export let homingStrikes = {
    name: 'Soul Blades: Homing Strikes',
    aliases: ['Homing Strikes'],
    version: '1.1.0',
    scaleAliases: psionicEnergy.scaleAliases,
    early: updateScales
};