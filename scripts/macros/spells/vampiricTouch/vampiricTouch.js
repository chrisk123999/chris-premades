import {chris} from '../../../helperFunctions.js';
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
    featureData.system.description.value = chris.getItemDescription('chris-premades.CPR Spell Features', 'Vampiric Touch Attack');
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
    let feature = workflow.actor.items.getName('Vampiric Touch Attack');
    if (feature && workflow.targets.size != 0) await feature.use();
}
async function vampiricTouchAttack(workflow) {
    if (workflow.hitTargets.size != 1) return;
    let targetActor = workflow.hitTargets.first().actor;
    let damage = workflow.damageTotal / 2;
    let hasImmunity = chris.checkTrait(targetActor, 'di', 'necrotic');
    if (hasImmunity) return;
    let hasResistance = chris.checkTrait(targetActor, 'dr', 'necrotic');
    if (hasResistance) damage = damage / 2;
    damage = Math.floor(damage);
    if (damage != 0) await chris.applyDamage([workflow.token], damage, 'healing');
}
export let vampiricTouch = {
    'item': vampiricTouchItem,
    'attack': vampiricTouchAttack
}