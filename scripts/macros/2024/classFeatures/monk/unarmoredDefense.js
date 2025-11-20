export let unarmoredDefenseMonk = {
    name: 'Unarmored Defense (Monk)',
    aliases: ['Unarmored Defense'],
    version: '1.3.136',
    rules: 'modern',
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'monk',
            category: 'homebrew',
            homebrew: true
        }
    ],
    ddbi: {
        restrictedItems: {
            'Unarmored Defense 2': {
                originalName: 'Unarmored Defense',
                requiredClass: 'Monk',
                requiredSubclass: null,
                requiredRace: null,
                requiredEquipment: [],
                requiredFeatures: [],
                replacedItemName: 'Unarmored Defense (Monk)',
                removedItems: [],
                additionalItems: [],
                priority: 0
            },
        }
    }
};