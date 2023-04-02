import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
export async function deathWard(token, {item, workflow, ditem}) {
	let effect = chris.findEffect(token.actor, 'Death Ward');
	if (!effect) return;
	let queueSetup = await queue.setup(workflow.item.uuid, 'deathWard', 390);
    if (!queueSetup) return;
	if (ditem.newHP != 0) {
		queue.remove(workflow.item.uuid);
		return;
	}
	ditem.newHP = 1;
	ditem.hpDamage = Math.abs(ditem.newHP - ditem.oldHP);
	await chris.removeEffect(effect);
	queue.remove(workflow.item.uuid);
}