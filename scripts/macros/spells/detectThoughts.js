import {chris} from '../../helperFunctions.js';
async function detectThoughtsProbeItem({speaker, actor, token, character, item, args}) {
    if (this.failedSaves.size === 1) return;
    let effect = chris.findEffect(this.actor, 'Detect Thoughts');
    if (!effect) return;
    await chris.removeEffect(effect);
    await chris.removeCondition(this.actor, 'Concentrating');
}
async function detectThoughtsItem({speaker, actor, token, character, item, args}) {
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Detect Thoughts - Probe Deeper', false);
    if (!featureData) return;
    featureData.system.save.dc = chris.getSpellDC(this.item);
	featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Detect Thoughts - Probe Deeper');
    async function effectMacro () {
		await warpgate.revert(token.document, 'Detect Thoughts - Probe Deeper');
	}
    let effectData = {
		'label': this.item.name,
		'icon': this.item.img,
		'duration': {
			'seconds': 60
		},
		'origin': this.item.uuid,
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
export let detectThoughts = {
    'item': detectThoughtsItem,
    'probe': detectThoughtsProbeItem
}