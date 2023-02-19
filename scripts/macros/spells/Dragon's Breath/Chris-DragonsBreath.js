import {chris} from '../../../helperFunctions.js';
export async function dragonsBreath (workflow) {
	if (workflow.targets.size != 1) return;
	let targetToken = workflow.targets.first();
	let spellLevel = workflow.castData.castLevel;
	let spellDC = chris.getSpellDC(workflow.item);
	let damageType = await chris.dialog('What damage type?', [['🧪 Acid', 'acid'], ['❄️ Cold', 'cold'], ['🔥 Fire', 'fire'], ['⚡ Lightning', 'lightning'], ['☠️ Poison', 'poison']]);
	if (!damageType) damageType = 'fire';
	let packName = 'world.automated-spells';
	let pack = game.packs.get(packName);
	if (!pack) return;
	let packItems = await pack.getDocuments();
	if (packItems.length === 0) return;
	let itemData = packItems.find(item => item.name === 'Dragon Breath');
	if (!itemData) return;
	let itemObject = itemData.toObject();
	let diceNumber = spellLevel + 1;
	itemObject.system.damage.parts = [
		[
			diceNumber + 'd6[' + damageType + ']',
			damageType
		]
	];
	itemObject.system.save.dc = spellDC;
	let effectData = {
		'label': itemObject.name,
		'icon': 'icons/magic/acid/projectile-smoke-glowing.webp',
		'duration': {
			'seconds': 60
		},
		'origin': workflow.item.uuid,
		'flags': {
			'effectmacro': {
				'onDelete': {
					'script': "warpgate.revert(token.document, '" + itemObject.name + "');"
				}
			},
		}
	};
	let updates = {
		'embedded': {
			'Item': {
				[itemObject.name]: itemObject
			},
			'ActiveEffect': {
				[itemObject.name]: effectData
			}
		}
	};
	let options = {
		'permanent': false,
		'name': itemObject.name,
		'description': itemObject.name
	};
	await warpgate.mutate(targetToken.document, updates, {}, options);
}