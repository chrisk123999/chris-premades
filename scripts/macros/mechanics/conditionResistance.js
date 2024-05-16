import {chris} from '../../helperFunctions.js';
let effectData = {
    'name': 'Condition Advantage',
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
    ],
    'flags': {
        'chris-premades': {
            'effect': {
                'noAnimation': true
            }
        }
    }
};
let cleanUpList =[];
export async function conditionResistanceEarly(workflow) {
    if (!workflow.targets.size) return;
    if (workflow.item.system.save?.dc === null || workflow.item.system.save === undefined) return;
    if (!workflow.item.effects.size) return;
    let itemConditions = new Set();
    workflow.item.effects.forEach(effect => {
        effect.changes.forEach(element => {
            if (element.key === 'macro.CE') itemConditions.add(element.value.toLowerCase());
        });
        let effectConditions = effect.flags['chris-premades']?.conditions;
        if (effectConditions) effectConditions.forEach(c => itemConditions.add(c.toLowerCase()));
    });
    if (!itemConditions.size) return;
    await Promise.all(workflow.targets.map(async tokenDoc => {
        await Promise.all(itemConditions.map(async condition => {
            let flagData = tokenDoc.document.actor.flags['chris-premades']?.CR?.[condition];
            if (flagData) {
                let types = String(flagData).split(',').map(i => i.toLowerCase());
                if (types.includes('1') || types.includes('true') || types.includes(workflow.item.system.save.ability)) {
                    await chris.createEffect(tokenDoc.document.actor, effectData);
                    cleanUpList.push(tokenDoc.document.actor);
                }
            }
        }));
    }));
}
export async function conditionResistanceLate(workflow) {
    for (let i of cleanUpList) {
        let effect = chris.findEffect(i, 'Condition Advantage');
        if (effect) await chris.removeEffect(effect);
    }
    cleanUpList = [];
}