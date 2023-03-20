import {chris} from '../../helperFunctions.js';
async function vampiricTouchItem({speaker, actor, token, character, item, args}) {
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Vampiric Touch Attack', false);
    if (!featureData) return;
    let spellLevel = this.castData.castLevel;
    featureData.system.damage.parts = [
		[
            spellLevel + 'd6[necrotic]',
            'necrotic'
		]
	];
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Vampiric Touch Attack');
	featureData.flags['chris-premades'] = {
		'spell': {
			'vampiricTouchAttack': true
		}
	}
    async function effectMacro () {
		await warpgate.revert(token.document, 'Vampiric Touch');
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
		'name': this.item.name,
		'description': featureData.name
	};
	await warpgate.mutate(this.token.document, updates, {}, options);
	let feature = this.actor.items.find(item => item.flags['chris-premades']?.spell?.vampiricTouchAttack);
	if (!feature) return;
	let options2 = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [this.targets.first().document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    await MidiQOL.completeItemUse(feature, {}, options2);
}
async function vampiricTouchAttack({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    let damage = chris.totalDamageType(this.targets.first().actor, this.damageDetail, 'necrotic');
    if (!damage) return;
	damage = Math.floor(damage / 2);
    await chris.applyDamage([this.token], damage, 'healing');
}
export let vampiricTouch = {
    'item': vampiricTouchItem,
    'attack': vampiricTouchAttack
}