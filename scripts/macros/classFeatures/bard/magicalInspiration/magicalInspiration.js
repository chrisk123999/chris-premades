import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function bardicInspirationAttack({speaker, actor, token, character, item, args}) {
	if (this.targets.size === 0) return;
	if (this.isFumble) return;
	let effect = chris.findEffect(this.actor, 'Inspired');
	if (!effect) return;
	let originItem = await fromUuid(effect.origin);
	let bardDice = originItem.actor.system.scale?.bard['bardic-inspiration'];
	if (!bardDice) {
		ui.notifications.warn('Source actor does not appear to have a Bardic Inspiration scale!');
		return;
	}
	let queueSetup = await queue.setup(this.item.uuid, 'bardicInspiration', 150);
	if (!queueSetup) return;
	let selection = await chris.dialog('Use Bardic Inspiration? (Attack Total: ' + this.attackTotal + ')', [['Yes', true], ['No', false]]);
	if (!selection) {
		queue.remove(this.item.uuid);
		return;
	}
	await chris.removeEffect(effect);
	let updatedRoll = await chris.addToRoll(this.attackRoll, bardDice);
	this.setAttackRoll(updatedRoll);
	queue.remove(this.item.uuid);
}
async function bardicInspirationDamage({speaker, actor, token, character, item, args}) {
	if (this.targets.size === 0) return;
	if ((this.item.system.actionType === 'msak' || this.item.system.actionType === 'rsak') && this.hitTargets.size === 0 && orkflow.item.type != 'spell') return;
	let effect = chris.findEffect(this.actor, 'Inspired');
	if (!effect) return;
	let originItem = await fromUuid(effect.origin);
	let bardDice = originItem.actor.system.scale?.bard['bardic-inspiration'];
	if (!bardDice) {
		ui.notifications.warn('Source actor does not appear to have a Bardic Inspiration scale!');
		return;
	}
	let queueSetup = await queue.setup(this.item.uuid, 'bardicInspiration', 150);
	if (!queueSetup) return;
	let buttons = [
		{
			'label': 'Yes',
			'value': true
		}, {
			'label': 'No',
			'value': false
		}
	];
	let selection = await chris.selectTarget('Use Magical Inspiration?', buttons, this.targets, false, 'one');
	if (selection.buttons === false) {
		queue.remove(this.item.uuid);
		return;
	}
	await chris.removeEffect(effect);
	let targetTokenID = selection.inputs.find(id => id != false);
	if (!targetTokenID) {
		queue.remove(this.item.uuid);
		return;
	}
	let targetDamage = this.damageList.find(i => i.tokenId === targetTokenID);
	let defaultDamageType = this.defaultDamageType;
	let roll = await new Roll(bardDice + '[' + defaultDamageType + ']').roll({async: true});
	roll.toMessage({
		rollMode: 'roll',
		speaker: {alias: name},
		flavor: 'Magical Inspiration'
	});
	let targetActor = canvas.scene.tokens.get(targetDamage.tokenId).actor;
	if (!targetActor) {
		queue.remove(this.item.uuid);
		return;
	}
	let hasDI = chris.checkTrait(targetActor, 'di', defaultDamageType);
	if (hasDI) {
		queue.remove(this.item.uuid);
		return;
	}
	let damageTotal = roll.total;
	let hasDR = chris.checkTrait(targetActor, 'dr', defaultDamageType);
	if (hasDR) damageTotal = Math.floor(damageTotal / 2);
	targetDamage.damageDetail[0].push(
		{
			'damage': damageTotal,
			'type': defaultDamageType
		}
	);
	targetDamage.totalDamage += damageTotal;
	if (this.defaultDamageType === 'healing') {
		targetDamage.newHP += roll.total;
		targetDamage.hpDamage -= damageTotal;
		targetDamage.appliedDamage -= damageTotal;
	} else {
		targetDamage.appliedDamage += damageTotal;
		targetDamage.hpDamage += damageTotal;
		if (targetDamage.oldTempHP > 0) {
			if (targetDamage.oldTempHP >= damageTotal) {
				targetDamage.newTempHP -= damageTotal;
			} else {
				let leftHP = damageTotal - targetDamage.oldTempHP;
				targetDamage.newTempHP = 0;
				targetDamage.newHP -= leftHP;
			}
		} else {
			targetDamage.newHP -= damageTotal;
		}
	}
	queue.remove(this.item.uuid);
}
export let bardicInspiration = {
	'attack': bardicInspirationAttack,
	'damage': bardicInspirationDamage
}