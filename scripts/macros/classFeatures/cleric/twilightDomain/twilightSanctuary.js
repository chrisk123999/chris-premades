import {chris} from '../../../../helperFunctions.js';
async function turnStart(token, origin) {
    let targetTokenId = game.combat.previous.tokenId;
    if (!targetTokenId) return;
    let targetToken = canvas.scene.tokens.get(targetTokenId);
    if (!targetToken) return;
    if (targetToken.disposition != 1) return;
    let distance = await chris.getDistance(token, targetToken);
    if (distance > 30) return;
    let originClassLevels = origin.actor.classes.cleric?.system?.levels;
    if (!originClassLevels) originClassLevels = 0;
    async function effectMacro() {
        await chrisPremades.macros.twilightSanctuary.dialog(token, actor, effect);
    }
    let effectData = {
		'label': origin.name,
		'icon': origin.img,
		'duration': {
			'seconds': 6
		},
		'origin': token.actor.uuid,
		'flags': {
			'effectmacro': {
				'onCreate': {
					'script': chris.functionToString(effectMacro)
				}
			},
			'chris-premades': {
				'feature': {
					'twilightSanctuary': '1d6[temphp] + ' + originClassLevels
				}
			}
		}
	};
    await chris.createEffect(targetToken.actor, effectData);
}
async function dialog(token, actor, effect) {
    let charmedEffect = chris.findEffect(actor, 'Charmed');
    let frightenedEffect = chris.findEffect(actor, 'Frightened');
    let generatedMenu = [['Temporary HP', 'hp']];
    if (charmedEffect) generatedMenu.push(['Remove Charmed Condition', 'Charmed']);
    if (frightenedEffect) generatedMenu.push(['Remove Frightened Condition', 'Frightened']);
    generatedMenu.push(['None', false]);
    let selection = await chris.dialog('Twilight Sanctuary: What would you like to do?', generatedMenu);
    switch (selection) {
        case 'hp':
            let damageFormula = effect.flags['chris-premades'].feature.twilightSanctuary;
            let roll = await new Roll(damageFormula).roll({async: true});
            roll.toMessage({
                rollMode: 'roll',
                speaker: {alias: name},
                flavor: 'Twilight Sanctuary'
            });
            await chris.applyDamage([token], roll.total, 'temphp');
            break;
        case 'Charmed':
        case 'Frightened':
            await chris.removeCondition(actor, selection);
            break;
    }
    await effect.delete();
}
export let twilightSanctuary = {
    'turnStart': turnStart,
    'dialog': dialog
}