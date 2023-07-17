import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function eyesOfMinuteSeeing(skillId, options) {
    if (skillId != 'inv' || options.advantage) return;
    let queueSetup = queue.setup(skillId, 'eyesOfMinuteSeeing', 50);
    if (!queueSetup) return false;
    let selection = await chris.dialog('Eyes of Minute Seeing', [['Yes', true], ['No', false]], 'Does this check rely on sight while<br>searching an area or studying an object?') ?? false;
    if (selection) options.advantage = true;
    queue.remove(skillId);
}