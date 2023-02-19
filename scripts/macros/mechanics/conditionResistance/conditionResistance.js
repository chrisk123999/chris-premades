import {chris} from '../../../helperFunctions.js';
let effectData = {
	'label': 'Condition Advantage',
	'icon': 'icons/magic/time/arrows-circling-green.webp',
	'duration': {
		'turns': 1
	},
	'changes': [
		{
			'key': 'flags.midi-qol.advantage.ability.save.all',
			'value': '1',
			'mode': 5,
			'priority': 120
		}
	]
};
let cleanUpList =[];
export async function conditionResistanceEarly(workflow) {
    if (workflow.targets.size === 0) return;
    if (workflow.item.system.save?.dc === null || workflow.item.system.save === undefined) return;
    if (workflow.item.effects.size === 0) return;
    let itemConditions = new Set();
    workflow.item.effects.forEach(effect => {
        effect.changes.forEach(element => {
            if (element.key === 'macro.CE') itemConditions.add(element.value.toLowerCase());
        });
    });
    if (itemConditions.size === 0) return;
    workflow.targets.forEach(tokenDoc => {
        itemConditions.forEach(async condition => {
            if (tokenDoc.document.actor.flags['chris-premades']?.CR?.[condition] === 1) {
                await chris.createEffect(tokenDoc.document.actor, effectData);
                cleanUpList.push(tokenDoc.document.actor);
            }
        });
    });
}
export async function conditionResistanceLate(workflow) {
    for (let i=0; cleanUpList.length > i; i++) {
        let effect = cleanUpList[i].effects.find(eff => eff.label === 'Condition Advantage');
        if (!effect) continue;
        await chris.removeEffect(effect);
    }
    cleanUpList = [];
}