export let chris = {
	'dialog': async function _dialog(title, options) {
		let buttons = options.map(([label,value]) => ({label,value}));
		let selected = await warpgate.buttonDialog(
			{
				buttons,
				title,
			},
			'column'
		);
		return selected;
	},
	'numberDialog': async function _numberDialog(title, buttons, options) {
		let inputs = [];
		for (let i of options) {
			inputs.push({
				'label': i,
				'type': 'number'
			});
		}
		let config = {
			'title': title
		};
		return await warpgate.menu(
			{
				'inputs': inputs,
				'buttons': buttons
			},
			config
		);
	},
	'findEffect': function _findEffect(actor, name) {
		return actor.effects.find(eff => eff.label === name);
	},
	'createEffect': async function _createEffect(actor, effectData) {
		if (game.user.isGM) {
			await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
		} else {
			await MidiQOL.socket().executeAsGM('createEffects', {'actorUuid': actor.uuid, 'effects': [effectData]});
		}
	},
	'removeEffect': async function _removeEffect(effect) {
		if (game.user.isGM) {
			await effect.delete();
		} else {
			await MidiQOL.socket().executeAsGM('removeEffects', {'actorUuid': effect.parent.uuid, 'effects': [effect.id]});
		}
	},
	'updateEffect': async function _updateEffect(effect, updates) {
		if (game.user.isGM) {
			await effect.update(updates);
		} else {
			updates._id = effect.id;
			await MidiQOL.socket().executeAsGM('updateEffects', {'actorUuid': effect.parent.uuid, 'updates': [updates]});
		}
	},
	'addCondition': async function _addCondition(actor, name, overlay, origin) {
		await game.dfreds.effectInterface.addEffect(
			{
				'effectName': name,
				'uuid': actor.uuid,
				'origin': origin,
				'overlay': overlay
			}
		);
	},
	'removeCondition': async function _removeCondition(actor, name) {
		await game.dfreds.effectInterface.removeEffect(
			{
				'effectName': name,
				'uuid': actor.uuid
			}
		);
	},
	'applyDamage': async function _applyDamage(tokenList, damageValue, damageType) {
		let targets;
		if (Array.isArray(tokenList)) {
			targets = new Set(tokenList);
		} else {
			targets = new Set([tokenList]);
		}
		await MidiQOL.applyTokenDamage(
			[
				{
					damage: damageValue,
					type: damageType
				}
			],
			damageValue,
			targets,
			null,
			null
		);
	},
	'applyWorkflowDamage': async function _applyWorkflowDamage(sourceToken, damageRoll, damageType, targets, flavor, itemCardId) {
		new MidiQOL.DamageOnlyWorkflow(sourceToken.actor, sourceToken, damageRoll.total, damageType, targets, damageRoll, {'flavor': flavor, 'itemCardId': itemCardId});
	},
	'findNearby': function _findNearby(tokenDoc, range, disposition) {
		let dispositionValue;
		switch (disposition) {
			case 'ally':
				dispositionValue = 1;
				break;
			case 'neutral':
				dispositionValue = 0;
				break;
			case 'enemy':
				dispositionValue = -1;
				break;
			default:
				dispositionValue = null;
		}
		return MidiQOL.findNearby(dispositionValue, tokenDoc, range);
	},
	'addToRoll': async function _addToRoll(roll, addonFormula) {
		let addonFormulaRoll = await new Roll('0 + ' + addonFormula).evaluate({async: true});
		game.dice3d?.showForRoll(addonFormulaRoll);
		for (let i = 1; i < addonFormulaRoll.terms.length; i++) {
			roll.terms.push(addonFormulaRoll.terms[i]);
		}
		roll._total += addonFormulaRoll.total;
		roll._formula = roll._formula + ' + ' + addonFormula;
		return roll;
	},
	'getSpellDC': function _getSpellDC(item) {
		let spellDC;
		let scaling = item.system.save.scaling;
		if (scaling === 'spell') {
			spellDC = item.actor.system.attributes.spelldc;
		} else  if (scaling != 'flat') {
			spellDC = item.actor.system.abilities[scaling].dc;
		} else {
			spellDC = item.system.save.dc;
			if (!spellDC) spellDC = 10;
		}
		return spellDC;
	},
	'getSpellMod': function _getSpellMod(item) {
		let spellMod;
		let scaling = item.system.save.scaling;
		if (scaling === 'spell') {
			spellMod = item.actor.system.abilities[item.actor.system.attributes.spellcasting].mod;
		} else {
			spellMod = item.actor.system.abilities[scaling].mod;
		}
		return spellMod;
	},
	'selectTarget': async function _selectTarget(title, buttons, targets, returnUuid, type) {
		let generatedInputs = [];
		let isFirst = true;
		let number = 1;
		for (let i of targets) {
			let name;
			if (game.settings.get('chris-premades', 'Show Names')) {
				name = i.document.name;
			} else {
				if (i.document.disposition <= 0) {
					name = 'Unknown Target (' + number + ')';
					number++;
				} else {
					name = i.document.name;
				}
			}
			let texture = i.document.texture.src;
			let html = `<img src="` + texture + `" id="` + i.id + `" style="width:40px;height:40px;vertical-align:middle;"><span> ` + name + `</span>`;
			let value = i.id;
			if (returnUuid) value = i.document.uuid;
			if (type === 'multiple') {
				generatedInputs.push({
					'label': html,
					'type': 'checkbox',
					'options': false,
					'value': value
				});
			} else if (type === 'one') {
				generatedInputs.push({
					'label': html,
					'type': 'radio',
					'options': ['group1', isFirst],
					'value': value
				});
				isFirst = false;
			} else if (type === 'number') {
				generatedInputs.push({
					'label': html,
					'type': 'number'
				});
			} else return {'buttons': false};
		}
		function dialogRender(html) {
			let trs = html[0].getElementsByTagName('tr');
			for (let t of trs) {
				t.style.display = 'flex';
				t.style.flexFlow = 'row-reverse';
				t.style.alignItems = 'center';
				t.style.justifyContent = 'flex-end';
				if (type === 'one') t.addEventListener('click', function () {t.getElementsByTagName('input')[0].checked = true});
			}
			let ths = html[0].getElementsByTagName('th');
			for (let t of ths) {
				t.style.width = 'auto';
				t.style.textAlign = 'left';
			}
			let tds = html[0].getElementsByTagName('td');
			for (let t of tds) {
				t.style.width = '50px';
				t.style.textAlign = 'center';
				t.style.paddingRight = '5px';
			}
			let imgs = html[0].getElementsByTagName('img');
			for (let i of imgs) {
				i.style.border = 'none';
				i.addEventListener('click', async function () {
					await canvas.ping(canvas.tokens.get(i.getAttribute('id')).document.object.center);
				});
				i.addEventListener('mouseover', function () {
					let targetToken = canvas.tokens.get(i.getAttribute('id'));
					targetToken.hover = true;
					targetToken.refresh();
				});
				i.addEventListener('mouseout', function () {
					let targetToken = canvas.tokens.get(i.getAttribute('id'));
					targetToken.hover = false;
					targetToken.refresh();
				});
			}
		}
		let config = {
			'title': title,
			'render': dialogRender
		};
		return await warpgate.menu(
			{
				'inputs': generatedInputs,
				'buttons': buttons
			},
			config
		);
	},
	'checkTrait': function _checkTrait(actor, type, trait) {
		return actor.system.traits[type].value.has(trait);
	},
	'functionToString': function _functiongToString(input) {
		return `(${input.toString()})()`;
	},
	'getItemFromCompendium': async function _getItemFromCompendium(key, name, ignoreNotFound, packFolderId) {
		const gamePack = game.packs.get(key);
		if (!gamePack) {
			ui.notifications.warn('Invalid compendium specified!');
			return false;
		}
		const packIndex = await gamePack.getIndex({fields: ['name', 'type', 'flags.cf.id']});
		const match = packIndex.find(item => item.name === name 
			&& (!packFolderId || (packFolderId && item.flags.cf?.id === packFolderId)));
		if (match) {
			return (await gamePack.getDocument(match._id))?.toObject();
		} else {
			if (!ignoreNotFound) ui.notifications.warn('Item not found in specified compendium! Check spelling?');
			return undefined;
		}
	},
	'raceOrType': function _raceOrType(actor) {
		return actor.type === "npc" ? actor.system.details?.type?.value : actor.system.details?.race;
	},
	'getItemDescription': function _getItemDescription(key, name) {
		let journalEntry = game.journal.getName(key);
		if (!journalEntry) {
			ui.notifications.error('Item descriptions journal entry not found!');
			return;
		}
		let page = journalEntry.pages.getName(name);
		if (!page) {
			ui.notifications.warn('Item description not found in journal!');
		}
		let description = page.text.content;
		return description;
	},
	'getDistance': function _getDistance(sourceToken, targetToken) {
		return MidiQOL.getDistance(sourceToken, targetToken, {wallsBlock: false});
	},
	'totalDamageType': function _totalDamageType(actor, damageDetail, type) {
		let total = 0;
		let immune = chris.checkTrait(actor, 'di', type);
		if (immune) return 0;
		for (let i of damageDetail) {
			if (i.type.toLowerCase() === type.toLowerCase()) total += i.damage;
		}
		let resistant = chris.checkTrait(actor, 'dr', type);
		if (resistant) total = Math.floor(total / 2);
		return total;
	},
	'getEffectCastLevel': function _getEffectCastLevel(effect) {
		return effect.flags['midi-qol']?.castData?.castLevel;
	},
	'getRollDamageTypes': function _getRollDamageTypes(damageRoll) {
		let types = new Set();
		for (let i of damageRoll.terms) {
			if (i.flavor != '') types.add(i.flavor);
		}
		return types;
	},
	'perTurnCheck': function _perTurnCheck(originItem, type, name, ownTurnOnly, tokenId) {
		if (game.combat === null || game.combat === undefined) return true;
		if (ownTurnOnly && (tokenId != game.combat.current.tokenId)) return false;
		let currentTurn = game.combat.round + '-' + game.combat.turn;
		let previousTurn = originItem.flags['chris-premades']?.[type]?.[name]?.turn;
		if (currentTurn != previousTurn) return true;
		return false;
	},
	'tokenInTemplate': function _tokenInTemplate(token, template) {
		let containedTokens = game.modules.get('templatemacro').api.findContained(template);
		let foundToken = containedTokens.find(i => i === token.id);
		return foundToken;
	},
	'tokenTemplates': function _tokenTemplates(token) {
		return game.modules.get('templatemacro').api.findContainers(token);
	},
	'inCombat': function _inCombat() {
		return !(game.combat === null || game.combat === undefined || game.combat?.started === false);
	},
	'addTempItem': async function _addTempItem(actor, itemData, itemID, category, favorite, itemNumber) {
		if (!itemData.flags['chris-premades']) itemData.flags['chris-premades'] = {}
		itemData.flags['chris-premades'].tempItem = {
			'source': itemID,
			'itemNumber': itemNumber
		}
		if (category) itemData.flags['custom-character-sheet-sections'] = {
            'sectionName': category
        };
		if (favorite) itemData.flags['tidy5e-sheet'] = {
			'favorite': true
		};
		await actor.createEmbeddedDocuments('Item', [itemData]);
	},
	'removeTempItems': async function _removeTempItems(actor, itemID) {
		let items = actor.items.filter(item => item.flags['chris-premades']?.tempItem?.source === itemID);
		for (let i of items) {
			await i.delete();
		}
	},
	'getTempItem': function _getTempItem(actor, itemID, itemNumber) {
		return actor.items.find(item => item.flags['chris-premades']?.tempItem?.source === itemID && item.flags['chris-premades']?.tempItem?.itemNumber === itemNumber);
	},
	'getCompendiumItemDescription': async function _getCompendiumItemDescription(name) {
		let itemData = await chris.getItemFromCompendium(game.settings.get('chris-premades', 'Item Compendium'), name, false);
		if (itemData) return itemData.system.description.value;
	},
	'updateTargets': function _updateTargets(targets) {
		game.user.updateTokenTargets(targets);
	},
	'increaseExhaustion': async function _increaseExhaustion(actor, originUuid) {
		let effect = actor.effects.find(eff => eff.label.includes('Exhaustion'));
		if (!effect) {
			await chris.addCondition(actor, 'Exhaustion 1', false, originUuid);
			return;
		}
		let level = Number(effect.label.substring(11));
		if (isNaN(level)) return;
		if (level >= 5) {
			await chris.addCondition(actor, 'Dead', true, originUuid);
			return;
		}
		let conditionName = effect.label.substring(0, 11) + (level + 1);
		await chris.removeEffect(effect);
		await chris.addCondition(actor, conditionName, false, originUuid);
	}
};
