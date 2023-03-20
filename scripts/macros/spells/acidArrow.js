import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function attack({speaker, actor, token, character, item, args}) {
	if (!this.isFumble) return;
    let queueSetup = await queue.setup(this.item.uuid, 'acidArrow', 50);
    if (!queueSetup) return;
	this.isFumble = false;
	let updatedRoll = await new Roll('-100').evaluate({async: true});
	this.setAttackRoll(updatedRoll);
    queue.remove(this.item.uuid);
}
async function damage({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 0) return;
    let queueSetup = await queue.setup(this.item.uuid, 'acidArrow', 50);
    if (!queueSetup) return;
    await chris.applyDamage([this.targets.first()], Math.floor(this.damageRoll.total / 2), 'acid');
    queue.remove(this.item.uuid);
}
export let acidArrow = {
    'attack': attack,
    'damage': damage
}