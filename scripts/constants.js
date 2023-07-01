const advantageEffectData = {
    'label': 'Save Advantage',
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
const disadvantageEffectData = {
    'label': 'Save Disadvantage',
    'icon': 'icons/magic/time/arrows-circling-green.webp',
    'duration': {
        'turns': 1
    },
    'changes': [
        {
            'key': 'flags.midi-qol.disadvantage.ability.save.all',
            'value': '1',
            'mode': 5,
            'priority': 120
        }
    ]
};
function syntheticItemWorkflowOptions(targets, useSpellSlot, castLevel) {
    return [
        {
            'showFullCard': false,
            'createWorkflow': true,
            'configureDialog': false,
            'consumeResource': false,
            'consumeRecharge': false,
            'consumeQuantity': false,
            'consumeUsage': false,
            'consumeSpellSlot': useSpellSlot ?? false,
            'consumeSpellLevel': castLevel ?? false
        },
        {
            'targetUuids': targets,
            'workflowOptions': {
                'autoRollDamage': 'always',
                'autoFastDamage': true
            }
        }
    ];
}
let damageTypes;
function damageTypeMenu() {
    if (!damageTypes) damageTypes = Object.entries(CONFIG.DND5E.damageTypes).filter(i => i[0] != 'midi-none').map(j => [j[1], j[0]]);
    return damageTypes;
}
export let constants = {
    'syntheticItemWorkflowOptions': syntheticItemWorkflowOptions,
    'disadvantageEffectData': disadvantageEffectData,
    'advantageEffectData': advantageEffectData,
    'damageTypeMenu': damageTypeMenu
}