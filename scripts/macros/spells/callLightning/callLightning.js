import {chris} from '../../../helperFunctions.js';
export async function callLightning(workflow) {
	let storming = await chris.dialog('Is it already storming?', [['Yes', true], ['No', false]]);
	let spellLevel = workflow.castData.castLevel;
	if (storming) spellLevel += 1;
	let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Storm Bolt', false);
	featureData.system.damage.parts = [
		[
			spellLevel + 'd10[lightning]',
			'lightning'
		]
	];
	featureData.system.save.dc = chris.getSpellDC(workflow.item);
	featureData.system.description.value = workflow.item.system.description.value;
	async function effectMacro () {
		await warpgate.revert(token.document, 'Storm Bolt');
	}
	let effectData = {
		'label': workflow.item.name,
		'icon': workflow.item.img,
		'duration': {
			'seconds': 600
		},
		'origin': workflow.item.uuid,
		'flags': {
			'effectmacro': {
				'onDelete': {
					'script': chris.functionToString(effectMacro)
				}
			},
		}
	};
	let updates = {
		'embedded': {
			'Item': {
				[featureData.name]: featureData
			},
			'ActiveEffect': {
				[workflow.item.name]: effectData
			}
		}
	};
	let options = {
		'permanent': false,
		'name': featureData.name,
		'description': featureData.name
	};
	await warpgate.mutate(workflow.token.document, updates, {}, options);
}