import {queue} from '../../utility/queue.js';
import {chris} from '../../helperFunctions.js';
export async function thunderWave({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.failedSaves.size) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'thunderWave', 50);
    if (!queueSetup) return;
    for (let i of Array.from(workflow.failedSaves)) {
        chris.pushToken(workflow.token, i, 10);
    }
    queue.remove(workflow.item.uuid);
}