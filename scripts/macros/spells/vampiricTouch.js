import {chris} from '../../helperFunctions.js';
async function vampiricTouchItem(workflow) {
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Vampiric Touch Attack', false);
    if (!featureData) return;
    let spellLevel = workflow.castData.castLevel;
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
		'label': workflow.item.name,
		'icon': workflow.item.img,
		'duration': {
			'seconds': 60
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
		'name': workflow.item.name,
		'description': featureData.name
	};
	await warpgate.mutate(workflow.token.document, updates, {}, options);
	let feature = workflow.actor.items.find(item => item.flags['chris-premades']?.spell?.vampiricTouchAttack);
	if (!feature) return;
	let options2 = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [workflow.targets.first().document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    await MidiQOL.completeItemUse(feature, {}, options2);
}
async function vampiricTouchAttack(workflow) {
    if (workflow.hitTargets.size != 1) return;
    let damage = chris.totalDamageType(workflow.targets.first().actor, workflow.damageDetail, 'necrotic');
    if (!damage) return;
	damage = Math.floor(damage / 2);
    await chris.applyDamage([workflow.token], damage, 'healing');
}
export let vampiricTouch = {
    'item': vampiricTouchItem,
    'attack': vampiricTouchAttack
}