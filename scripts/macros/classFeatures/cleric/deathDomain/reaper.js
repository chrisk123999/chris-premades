import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
export async function reaper({speaker, actor, token, character, item, args}) {
	if (this.targets.size != 1) return;
	if (this.item.type != 'spell' || this.item.system.level != 0 || this.item.system.school != 'nec' || this.item.flags['chris-premades']?.reap) return;
	let targetToken = this.targets.first();
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
	let queueSetup = await queue.setup(this.item.uuid, 'reaper', 450);
	if (!queueSetup) return;
	let selected = await chris.selectTarget('Use Reaper?', buttons, nearbyTargets, true, 'one');
	if (selected.buttons === false) {
		queue.remove(this.item.uuid);
		return;
	}
	let targetTokenUuid = selected.inputs.find(id => id != false);
	if (!targetTokenUuid) {
		queue.remove(this.item.uuid);
		return;
	}
	let effect = chris.findEffect(this.actor, 'Reaper');
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
	let spellData = duplicate(this.item.toObject());
	spellData.flags['chris-premades'] = {
		'reap': true
	};
	let spell = new CONFIG.Item.documentClass(spellData, {parent: this.actor});
	await MidiQOL.completeItemUse(spell, {}, options);
	queue.remove(this.item.uuid);
}