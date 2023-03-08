import {chris} from '../../helperFunctions.js';
export async function witherAndBloom(workflow) {
	if (workflow.targets.size === 0) return;
	let healTargets = [];
	for (let target of workflow.damageList) {
		let targetToken = await fromUuid(target.tokenUuid);
		if (workflow.token.document.disposition != targetToken.disposition) continue;
		target.damageDetail = [
			{
				'damage': 0,
				'type': 'necrotic'
			}
		];
		target.totalDamage = 0;
		target.newHP = target.oldHP;
		target.hpDamage = 0;
		target.appliedDamage = 0;
		healTargets.push(targetToken.object);
	}
	if (healTargets.length === 0) return;
	let buttons = [
		{
			'label': 'Yes',
			'value': true
		}, {
			'label': 'No',
			'value': false
		}
	];
	let selection = await chris.selectTarget('Heal a target?', buttons, healTargets, true);
	if (!selection.buttons) return;
	let targetTokenUuid = selection.inputs.find(id => id != false);
	if (!targetTokenUuid) return;
	async function effectMacro () {
		if (actor.type != 'character') {
			effect.delete();
			return;
		}
		let classDice = [];
		let classes = actor.classes;
		for (let [key, value] of Object.entries(classes)) {
			let hitDiceAvailable = value.system.levels - value.system.hitDiceUsed;
			if (hitDiceAvailable != 0) classDice.push({
				'class': key,
				'hitDice': value.system.hitDice,
				'available': hitDiceAvailable,
				'max': value.system.levels
			});
		}
		if (classDice.length === 0) {
			effect.delete();
			return;
		}
		let inputs = [];
		let outputs = [];
		for (let i of classDice) {
			inputs.push(i.class + ' (' + i.hitDice + ') [' + i.available + '/' + i.max + ']:');
			outputs.push(
				{
					'class': i.class,
					'dice': i.hitDice
				}
			);
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
		let maxHitDice = effect.flags.world.spell.witherAndBloom;
		let selection = await chrisPremades.helpers.numberDialog('Heal using hit dice? Max: ' + maxHitDice, buttons, inputs);
		if (!selection.buttons) {
			effect.delete();
			return;
		}
		let selectedTotal = 0;
		let healingFormula = '';
		for (let i = 0; selection.inputs.length > i; i++) {
			if (isNaN(selection.inputs[i])) continue;
			selectedTotal += selection.inputs[i];
			healingFormula = healingFormula + selection.inputs[i] + outputs[i].dice + '[healing] + ';
		}
		if (selectedTotal > maxHitDice) {
			ui.notifications.info('Too many hit dice selected!');
			effect.delete();
			return;
		}
		let conMod = actor.system.abilities.con.mod;
		let spellcastingMod = chrisPremades.helpers.getSpellMod(origin);
		healingFormula = healingFormula + '(' + selectedTotal + ' * ' + conMod + ') + ' + spellcastingMod;
		let healingRoll = await new Roll(healingFormula).roll({async: true});
		healingRoll.toMessage({
			rollMode: 'roll',
			speaker: {alias: name},
			flavor: 'Wither and Bloom'
		});
		chrisPremades.helpers.applyDamage([token], healingRoll.total, 'healing');
		for (let i = 0; selection.inputs.length > i; i++) {
			if (isNaN(selection.inputs[i])) continue;
			await actor.classes[outputs[i].class].update({
				'system.hitDiceUsed': actor.classes[outputs[i].class].system.hitDiceUsed + selection.inputs[i]
			});
		}
		effect.delete();
	}
	let effectData = {
		'label': workflow.item.name,
		'icon': workflow.item.img,
		'duration': {
			'seconds': 6
		},
		'origin': workflow.item.uuid,
		'flags': {
			'effectmacro': {
				'onCreate': {
					'script': chris.functionToString(effectMacro)
				}
			},
			'world': {
				'spell': {
					'witherAndBloom': workflow.castData.castLevel - 1
				}
			}
		}
	};
	let targetToken = await fromUuid(targetTokenUuid);
	await chris.createEffect(targetToken.actor, effectData);
}