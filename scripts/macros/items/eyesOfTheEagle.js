import {chris} from '../../helperFunctions.js';
export async function eyesOfTheEagle(skillId, options) {
    if (skillId != 'prc' || options.advantage) return;
    let selection = await chris.dialog('Eyes of the Eagle', [['Yes', true], ['No', false]], 'Does this check rely on sight?');
    if (selection) options.advantage = true;
}