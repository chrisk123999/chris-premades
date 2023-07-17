import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function eyesOfTheEagle(skillId, options) {
    if (skillId != 'prc' || options.advantage) return;
    let queueSetup = queue.setup(skillId, 'eyesOfTheEagle', 50);
    if (!queueSetup) return false;
    let selection = await chris.dialog('Eyes of the Eagle', [['Yes', true], ['No', false]], 'Does this check rely on sight?') ?? false;
    if (selection) options.advantage = true;
    queue.remove(skillId);
}