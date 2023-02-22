import {chris} from '../../../helperFunctions.js';
async function lightningArrowDamage (workflow) {
	if (workflow.item.name === 'Lightning Arrow - Burst') return;
	if (workflow.targets.size != 1) return;
	let targetToken = workflow.targets.first();
	if (!(workflow.item.system.properties?.thr || workflow.item.system.actionType === 'rwak')) return;
	let diceNumber = 4;
	if (workflow.isCritical) diceNumber = 8;
	let itemAbility = workflow.item.system.ability;
	if (itemAbility === '') {
		itemAbility = 'str';
		if (workflow.item.system.properties?.fin && workflow.actor.system.abilities.dex.mod > workflow.actor.system.abilities.str) itemAbility = 'dex';
	}
	let modifier = workflow.actor.system.abilities[itemAbility].mod;
	let damageFormula = diceNumber + 'd8[lightning] + ' + modifier;
	let effect = chris.findEffect(workflow.actor, 'Lightning Arrow');
	let castLevel = 3;
	if (effect) {
		castLevel = effect.flags['midi-qol'].castData.castLevel;
		let extraDiceNumber = castLevel - 3;
		if (workflow.isCritical) extraDiceNumber = extraDiceNumber * 2;
		if (castLevel > 3) damageFormula = damageFormula + ' + ' + extraDiceNumber + 'd8[lightning]';
	}
	let damageRoll = await new Roll(damageFormula).roll({async: true});
	await workflow.setDamageRoll(damageRoll);
	if (workflow.hitTargets.size === 0) await chris.applyDamage([targetToken], Math.ceil(damageRoll.total / 2), 'lightning');
	let itemData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Lightning Arrow - Burst', false);
	if (!itemData) {
		if (effect) effect.delete();
		return;
	}
	let saveDiceNumber = castLevel - 1;
	itemData.system.damage.parts = [
		[
			saveDiceNumber + 'd8[lightning]',
			'lightning'
		]
	];
	if (effect) {
		let originItem = await fromUuid(effect.origin);
		itemData.system.save.dc = chris.getSpellDC(originItem);
	}
	itemData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Lightning Arrow - Burst');
	let areaFeature = new CONFIG.Item.documentClass(itemData, {parent: workflow.actor});
	let newTargets = chris.findNearby(targetToken, 10, null);
	let newTargetUuids =[];
	new Sequence().effect().atLocation(workflow.token).stretchTo(targetToken).file('jb2a.chain_lightning.secondary.blue').play();
	for (let i of newTargets) {
		newTargetUuids.push(i.document.uuid);
		new Sequence().effect().atLocation(targetToken).stretchTo(i).file('jb2a.chain_lightning.secondary.blue').play();
	}
	let options = {
		'showFullCard': false,
		'createWorkflow': true,
		'targetUuids': newTargetUuids,
		'configureDialog': false,
		'versatile': false,
		'consumeResource': false,
		'consumeSlot': false,
	};
	await MidiQOL.completeItemUse(areaFeature, {}, options);
	if (effect) effect.delete();
}
async function lightningArrowAttack(workflow) {
	if (!workflow.isFumble) return;
	workflow.isFumble = false;
	let updatedRoll = await new Roll('-100').evaluate({async: true});
	workflow.setAttackRoll(updatedRoll);
}
export let lightningArrow = {
	'attack': lightningArrowAttack,
	'damage': lightningArrowDamage
}