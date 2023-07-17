import {chris} from '../../helperFunctions.js';
export async function bootsOfElvenkind(skillId, options) {
    if (skillId != 'ste' || options.advantage) return;
    let selection = await chris.dialog('Boots of Elvenkind', [['Yes', true], ['No', false]], 'Does this check rely on moving silently?');
    if (selection) options.advantage = true;
}