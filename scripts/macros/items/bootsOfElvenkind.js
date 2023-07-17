import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function bootsOfElvenkind(skillId, options) {
    if (skillId != 'ste' || options.advantage) return;
    let queueSetup = queue.setup(skillId, 'bootsOfElvenKind', 50);
    if (!queueSetup) return false;
    let selection = await chris.dialog('Boots of Elvenkind', [['Yes', true], ['No', false]], 'Does this check rely on moving silently?') ?? false;
    if (selection) options.advantage = true;
    queue.remove(skillId);
}