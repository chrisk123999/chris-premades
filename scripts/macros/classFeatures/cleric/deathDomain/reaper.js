import {chris} from '../../../../helperFunctions.js';
export async function reaper(workflow) {
	if (workflow.targets.size != 1) return;
	if (workflow.item.type != 'spell' || workflow.item.system.level != 0 || workflow.item.system.school != 'nec' || workflow.item.flags['chris-premades']?.reap) return;
	let targetToken = workflow.targets.first();
	let nearbyTargets = chris.findNearby(targetToken, 5, 'ally');
	if (nearbyTargets.length === 0) return;
	let buttons = [
		{
			'label': 'Yes',
			'value': true
		}, {
			'label': 'No',
			'value': false
		}
	];
	let selected = await chris.selectTarget('Use Reaper?', buttons, nearbyTargets, true, false);
	if (selected.buttons === false) return;
	let targetTokenUuid = selected.inputs.find(id => id != false);
	if (!targetTokenUuid) return;
	let effect = chris.findEffect(workflow.actor, 'Reaper');
	let originItem = await fromUuid(effect.origin);
	if (originItem)	await originItem.use();
	let options = {
		'showFullCard': false,
		'createWorkflow': true,
		'targetUuids': [targetTokenUuid],
		'configureDialog': false,
		'versatile': false,
		'consumeResource': false,
		'consumeSlot': false,
	};
	let spellData = duplicate(workflow.item.toObject());
	spellData.flags['chris-premades'] = {
		'reap': true
	};
	let spell = new CONFIG.Item.documentClass(spellData, {parent: workflow.actor});
	await MidiQOL.completeItemUse(spell, {}, options);
}