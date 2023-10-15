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
function syntheticItemWorkflowOptions(targets, useSpellSlot, castLevel, consume) {
    return [
        {
            'showFullCard': false,
            'createWorkflow': true,
            'consumeResource': consume ?? false,
            'consumeRecharge': consume ?? false,
            'consumeQuantity': consume ?? false,
            'consumeUsage': consume ?? false,
            'consumeSpellSlot': useSpellSlot ?? false,
            'consumeSpellLevel': castLevel ?? false
        },
        {
            'targetUuids': targets,
            'configureDialog': false,
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
const attacks = [
    'mwak',
    'rwak',
    'msak',
    'rsak'
];
const meleeAttacks = [
    'mwak',
    'msak'
];
const rangedAttacks = [
    'rwak',
    'rsak'
];
const weaponAttacks = [
    'mwak',
    'rwak'
];
const spellAttacks = [
    'msak',
    'rsak'
];
const yesNo = [
    ['Yes', true],
    ['No', false]
];
const okCancel = [
    {
        'label': 'Cancel',
        'value': false
    },
    {
        'label': 'Ok',
        'value': true
    }
];
export let constants = {
    'syntheticItemWorkflowOptions': syntheticItemWorkflowOptions,
    'disadvantageEffectData': disadvantageEffectData,
    'advantageEffectData': advantageEffectData,
    'damageTypeMenu': damageTypeMenu,
    'attacks': attacks,
    'yesNo': yesNo,
    'okCancel': okCancel,
    'meleeAttacks': meleeAttacks,
    'rangedAttacks': rangedAttacks,
    'weaponAttacks': weaponAttacks,
    'spellAttacks': spellAttacks
}