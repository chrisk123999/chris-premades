import {chris} from '../../../helperFunctions.js';
if (this.hitTargets.size != 1) return;
let targetToken = this.targets.first();
let targetActor = targetToken.actor;
let featureName = this.item.name;
let targetEffect = chris.findEffect(targetActor, featureName);
let damageRoll = await new Roll('1d6').roll({async: true});
damageRoll.toMessage({
    rollMode: 'roll',
    speaker: {alias: name},
    flavor: this.item.name
});
let hpReductionTotal = -damageRoll.total;
if (!targetEffect) {
    let effectData = {
		'label': featureName,
		'icon': this.item.img,
		'duration': {
			'seconds': 604800
		},
		'changes': [
			{
				'key': 'system.attributes.hp.tempmax',
				'mode': 2,
				'value': hpReductionTotal,
				'priority': 20
			}
		],
		'flags': {
			'dae': {
				'specialDuration': [
					'longRest'
				]
			}
		}
	};
	await chris.createEffect(targetActor, effectData);
} else {
    let oldAppliedDamage = Number(targetEffect.changes[0].value);
    hpReductionTotal += oldAppliedDamage;
    let updates = {
        '_id': targetEffect.id,
        'changes': [
			{
				'key': 'system.attributes.hp.tempmax',
				'mode': 2,
				'value': hpReductionTotal,
				'priority': 20
			}
		]
    };
    await chris.updateEffect(targetEffect, updates);
}
let targetMaxHP = targetActor.system.attributes.hp.max;
if (Math.abs(hpReductionTotal) >= targetMaxHP) {
    await chris.removeCondition(targetActor, 'Unconscious');
    await chris.addCondition(targetActor, 'Dead', true, null)
}