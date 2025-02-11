import {effectUtils, constants, genericUtils, actorUtils, activityUtils} from '../../utils.js';
import {custom} from '../../events/custom.js';
let validKeys = [
    'macro.CE',
    'macro.CUB',
    'macro.StatusEffect',
    'StatusEffect'
];
let effectData = {
    name: 'Condition Advantage',
    img: constants.tempConditionIcon,
    duration: {
        turns: 1
    },
    changes: [
        {
            key: 'flags.midi-qol.advantage.ability.save.all',
            value: '1',
            mode: 5,
            priority: 120
        }
    ]
};
async function preambleComplete(workflow) {
    if (!workflow.targets.size || !workflow.item) return;
    if (!activityUtils.hasSave(workflow.activity)) return;
    let activityConditions = activityUtils.getConditions(workflow.activity);
    if (workflow.workflowOptions.isOverTime) {
        try {
            let effects = actorUtils.getEffects(workflow.targets.first().actor);
            let effect = effects.find(i => i.changes.find(j => j.key === 'flags.midi-qol.OverTime' && j.value.includes(workflow.item.name))) ?? effects.find(i => i.name === workflow.item.name && i.changes.find(j => j.key === 'flags.midi-qol.OverTime'));
            if (effect) {
                effect.changes.forEach(element => {
                    if (validKeys.includes(element.key)) activityConditions.add(element.value.toLowerCase());
                });
                let effectConditions = effect.flags['chris-premades']?.conditions;
                if (effectConditions) effectConditions.forEach(c => activityConditions.add(c.toLowerCase()));
                activityConditions = activityConditions.union(effect.statuses ?? new Set());
            }
        } catch (error) { /* empty */ }
    }
    let proneMacros = [
        'proneOnFailMacro',
        'backbreakerUse',
        'toppleUse'
    ];
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let macros = (workflow.item.flags['chris-premades']?.macros?.midi?.item ?? [])
        .flatMap(i => custom.getMacro(i, genericUtils.getRules(workflow.item))?.midi?.item)
        .filter(i => i && (!i.activities?.length || i.activities.includes(activityIdentifier)))
        .map(i => i.macro.name);
    if (macros.some(i => proneMacros.includes(i))) activityConditions.add('prone');
    if (!activityConditions.size) return;
    await Promise.all(workflow.targets.map(async token => {
        await Promise.all(activityConditions.map(async condition => {
            let flagData = token.document.actor?.flags?.['chris-premades']?.CR?.[condition];
            if (flagData) {
                let types = String(flagData).split(',').map(i => i.toLowerCase());
                if (types.includes('1') || types.includes('true') || types.includes(workflow.activity.save.ability.first())) {
                    await effectUtils.createEffect(token.document.actor, effectData, {identifier: 'conditionResistance', animate: false});
                }
            }
        }));
    }));
}
async function RollComplete(workflow) {
    if (!workflow.targets.size) return;
    await Promise.all(workflow.targets.map(async token => {
        let effect = effectUtils.getEffectByIdentifier(token.actor, 'conditionResistance');
        if (effect) await genericUtils.remove(effect);
    }));
}
export let conditionResistance = {
    preambleComplete,
    RollComplete
};