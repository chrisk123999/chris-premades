import {genericUtils} from '../../../../../proxy.mjs';
import {getLandIdentifiers, getLandItem} from './circleOfTheLandSpells.mjs';
async function pick({workflow}) {
    const lands = getLandIdentifiers(workflow.actor).map(identifier => identifier.replace(/-land$/, ''));
    if (!lands.includes(workflow.activity?.identifier) || !getLandItem(workflow.actor)) return;
    genericUtils.notify('CHRISPREMADES.Macros.Modern.NaturesWard.LandItem', {type: 'info'});
    return true;
}
export const naturesWard = {
    name: 'Nature\'s Ward',
    version: '2.1.11',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: pick,
            priority: 50
        }
    ]
};
