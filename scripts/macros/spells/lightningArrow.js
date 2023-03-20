import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function lightningArrowDamage({speaker, actor, token, character, item, args}) {
	if (this.item.name === 'Lightning Arrow - Burst') return;
	if (this.targets.size != 1) return;
	let queueSetup = await queue.setup(this.item.uuid, 'lightningArrow', 50);
	if (!queueSetup) return;
	let targetToken = this.targets.first();
	if (!(this.item.system.properties?.thr || this.item.system.actionType === 'rwak')) return;
	let diceNumber = 4;
	if (this.isCritical) diceNumber = 8;
	let itemAbility = this.item.system.ability;
	if (itemAbility === '') {
		itemAbility = 'str';
		if (this.item.system.properties?.fin && this.actor.system.abilities.dex.mod > this.actor.system.abilities.str) itemAbility = 'dex';
	}
	let modifier = this.actor.system.abilities[itemAbility].mod;
	let damageFormula = diceNumber + 'd8[lightning] + ' + modifier;
	let effect = chris.findEffect(this.actor, 'Lightning Arrow');
	let castLevel = 3;
	if (effect) {
		castLevel = effect.flags['midi-qol'].castData.castLevel;
		let extraDiceNumber = castLevel - 3;
		if (this.isCritical) extraDiceNumber = extraDiceNumber * 2;
		if (castLevel > 3) damageFormula = damageFormula + ' + ' + extraDiceNumber + 'd8[lightning]';
	}
	let damageRoll = await new Roll(damageFormula).roll({async: true});
	await this.setDamageRoll(damageRoll);
	if (this.hitTargets.size === 0) await chris.applyDamage([targetToken], Math.floor(damageRoll.total / 2), 'lightning');
	let itemData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Lightning Arrow - Burst', false);
	if (!itemData) {
		if (effect) effect.delete();
		queue.remove(this.item.uuid);
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
	let areaFeature = new CONFIG.Item.documentClass(itemData, {parent: this.actor});
	let newTargets = chris.findNearby(targetToken, 10, null);
	let newTargetUuids =[];
	new Sequence().effect().atLocation(this.token).stretchTo(targetToken).file('jb2a.chain_lightning.secondary.blue').play();
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
		'consumeSlot': false
	};
	await MidiQOL.completeItemUse(areaFeature, {}, options);
	if (effect) effect.delete();
	queue.remove(this.item.uuid);
}
async function lightningArrowAttack({speaker, actor, token, character, item, args}) {
	if (!this.isFumble) return;
	let queueSetup = await queue.setup(this.item.uuid, 'lightningArrow', 50);
	if (!queueSetup) return;
	this.isFumble = false;
	let updatedRoll = await new Roll('-100').evaluate({async: true});
	this.setAttackRoll(updatedRoll);
	queue.remove(this.item.uuid);
}
export let lightningArrow = {
	'attack': lightningArrowAttack,
	'damage': lightningArrowDamage
}