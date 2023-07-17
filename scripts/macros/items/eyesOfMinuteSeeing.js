import {chris} from '../../helperFunctions.js';
export async function eyesOfMinuteSeeing(skillId, options) {
    if (skillId != 'inv' || options.advantage) return;
    let selection = await chris.dialog('Eyes of Minute Seeing', [['Yes', true], ['No', false]], 'Does this check rely on sight while<br>searching an area or studying an object?');
    if (selection) options.advantage = true;
}