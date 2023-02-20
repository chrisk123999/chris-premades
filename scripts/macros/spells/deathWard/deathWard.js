import {chris} from '../../../helperFunctions.js';
export async function deathWard(token, {item, workflow, ditem}) {
	let effect = chris.findEffect(token.actor, 'Death Ward');
	if (!effect) return;
	if (ditem.newHP != 0) return;
	ditem.newHP = 1;
	ditem.hpDamage = Math.abs(ditem.newHP - ditem.oldHP);
	await chris.removeEffect(effect);
}