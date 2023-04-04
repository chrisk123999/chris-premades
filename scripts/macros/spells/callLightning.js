import {chris} from '../../helperFunctions.js';
export async function callLightning({speaker, actor, token, character, item, args}) {
	let storming = await chris.dialog('Is it already storming?', [['Yes', true], ['No', false]]);
	let spellLevel = this.castData.castLevel;
	if (storming) spellLevel += 1;
	let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Storm Bolt', false);
	if (!featureData) return;
	featureData.system.damage.parts = [
		[
			spellLevel + 'd10[lightning]',
			'lightning'
		]
	];
	featureData.system.save.dc = chris.getSpellDC(this.item);
	featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Storm Bolt');
	featureData.flags['chris-premades'] = {
		'spell': {
			'castData': this.castData
		}
	}
	featureData.flags['chris-premades'].spell.castData.school = this.item.system.school;
	async function effectMacro () {
		await warpgate.revert(token.document, 'Storm Bolt');
	}
	let effectData = {
		'label': this.item.name,
		'icon': this.item.img,
		'duration': {
			'seconds': 600
		},
		'origin': this.item.uuid,
		'flags': {
			'effectmacro': {
				'onDelete': {
					'script': chris.functionToString(effectMacro)
				}
			}
		}
	};
	let updates = {
		'embedded': {
			'Item': {
				[featureData.name]: featureData
			},
			'ActiveEffect': {
				[this.item.name]: effectData
			}
		}
	};
	let options = {
		'permanent': false,
		'name': featureData.name,
		'description': featureData.name
	};
	await warpgate.mutate(this.token.document, updates, {}, options);
}