import {chris} from '../../../../helperFunctions.js';
async function bardicInspirationAttack(workflow) {
	if (workflow.targets.size === 0) return;
	if (workflow.isFumble) return;
	let effect = chris.findEffect(workflow.actor, 'Inspired');
	if (!effect) return;
	let originItem = await fromUuid(effect.origin);
	let bardDice = originItem.actor.system.scale?.bard['bardic-inspiration'];
	if (!bardDice) {
		ui.notifications.warn('Source actor does not appear to have a Bardic Inspiration scale!');
		return;
	}
	let selection = await chris.dialog('Use Bardic Inspiration? (Attack Total: ' + workflow.attackTotal + ')', [['Yes', true], ['No', false]]);
	if (!selection) return;
	await chris.removeEffect(effect);
	let updatedRoll = await chris.addToRoll(workflow.attackRoll, bardDice);
	workflow.setAttackRoll(updatedRoll);
}

async function bardicInspirationDamage(workflow) {
	if (workflow.targets.size === 0) return;
	if ((workflow.item.system.actionType === 'msak' || workflow.item.system.actionType === 'rsak') && workflow.hitTargets.size === 0 && orkflow.item.type != 'spell') return;
	let effect = chris.findEffect(workflow.actor, 'Inspired');
	if (!effect) return;
	let originItem = await fromUuid(effect.origin);
	let bardDice = originItem.actor.system.scale?.bard['bardic-inspiration'];
	if (!bardDice) {
		ui.notifications.warn('Source actor does not appear to have a Bardic Inspiration scale!');
		return;
	}
	let buttons = [
		{
			'label': 'Yes',
			'value': true
		}, {
			'label': 'No',
			'value': false
		}
	];
	let selection = await chris.selectTarget('Use Magical Inspiration?', buttons, workflow.targets, false);
	if (selection.buttons === false) return;
	await chris.removeEffect(effect);
	let targetTokenID = selection.inputs.find(id => id != false);
	if (!targetTokenID) return;
	let targetDamage = workflow.damageList.find(i => i.tokenId === targetTokenID);
	let defaultDamageType = workflow.defaultDamageType;
	let roll = await new Roll(bardDice + '[' + defaultDamageType + ']').roll({async: true});
	roll.toMessage({
		rollMode: 'roll',
		speaker: {alias: name},
		flavor: 'Magical Inspiration'
	});
	let targetActor = canvas.scene.tokens.get(targetDamage.tokenId).actor;
	if (!targetActor) return;
	let hasDI = chris.checkTrait(targetActor, 'di', defaultDamageType);
	if (hasDI) return;
	let damageTotal = roll.total;
	let hasDR = chris.checkTrait(targetActor, 'dr', defaultDamageType);
	if (hasDR) damageTotal = Math.ceil(damageTotal / 2);
	targetDamage.damageDetail[0].push(
		{
			'damage': damageTotal,
			'type': defaultDamageType
		}
	);
	targetDamage.totalDamage += damageTotal;
	if (workflow.defaultDamageType === 'healing') {
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
}
export let bardicInspiration = {
	'attack': bardicInspirationAttack,
	'damage': bardicInspirationDamage
}