export let unarmoredDefenseBarbarian = {
    name: 'Unarmored Defense (Barbarian)',
    aliases: ['Unarmored Defense'],
    version: '1.1.22',
    rules: 'modern',
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'barbarian',
            category: 'homebrew',
            homebrew: true
        }
    ],
    ddbi: {
        restrictedItems: {
            'Unarmored Defense 1': {
                originalName: 'Unarmored Defense',
                requiredClass: 'Barbarian',
                requiredSubclass: null,
                requiredRace: null,
                requiredEquipment: [],
                requiredFeatures: [],
                replacedItemName: 'Unarmored Defense (Barbarian)',
                removedItems: [],
                additionalItems: [],
                priority: 0
            },
        }
    }
};