import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.isFumble) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'acidArrow', 50);
    if (!queueSetup) return;
    workflow.isFumble = false;
    let updatedRoll = await new Roll('-100').evaluate({async: true});
    workflow.setAttackRoll(updatedRoll);
    queue.remove(workflow.item.uuid);
}
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 0) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'acidArrow', 50);
    if (!queueSetup) return;
    await chris.applyDamage([workflow.targets.first()], Math.floor(workflow.damageRoll.total / 2), 'acid');
    queue.remove(workflow.item.uuid);
}
export let acidArrow = {
    'attack': attack,
    'damage': damage
}