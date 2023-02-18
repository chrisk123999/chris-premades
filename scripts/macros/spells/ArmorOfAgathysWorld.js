import {chris} from './scripts/helperFunctions.js';
Hooks.on('midi-qol.RollComplete', async workflow => {
    if (workflow.hitTargets.size != 1) return;
    let targetToken = workflow.targets.first();
    if (!targetToken) return;
    let targetActor = targetToken.actor;
    let attackType = workflow.item.system.actionType;
    if (!(attackType === 'mwak' || attackType === 'msak')) return;
	let targetEffect = chris.findEffect(targetActor, 'Armor of Agathy');
    if (!targetEffect) return;
    let damage = targetActor.flags['chris-premades']?.spell?.aoa;
    if (!damage) return;
    let tempHP = targetActor.system.attributes.hp.temp;
	if (tempHP === 0) await ['chris-premades'].removeEffect(targetEffect);
	await chris.applyDamage([workflow.token], damage, 'cold');
});