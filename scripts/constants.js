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
function syntheticItemWorkflowOptions(targets) {
    return {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': targets,
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeQuantity': false,
        'consumeUsage': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
}
export let constants = {
    'syntheticItemWorkflowOptions': syntheticItemWorkflowOptions,
    'disadvantageEffectData': disadvantageEffectData,
    'advantageEffectData': advantageEffectData
}