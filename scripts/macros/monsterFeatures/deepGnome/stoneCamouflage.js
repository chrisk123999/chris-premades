import {chris} from '../../../helperFunctions.js';
export async function stoneCamouflage(skillId, options) {
    if (skillId != 'ste' || options.advantage) return;
    let selection = await chris.dialog('Stone Camouflage', [['Yes', true], ['No', false]], 'Hiding in rocky terrain?');
    if (selection) options.advantage = true;
}