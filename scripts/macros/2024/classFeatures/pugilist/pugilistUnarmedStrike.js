export let pugilistUnarmedStrike = {
    name: 'Unarmed Strike (Pugilist)',
    version: '1.5.34',
    rules: 'modern',
    ddbi: {
        restrictedItems: {
            'Unarmed Strike 5': {
                originalName: 'Unarmed Strike',
                requiredClass: 'Pugilist',
                requiredSubclass: null,
                requiredRace: null,
                requiredEquipment: [],
                requiredFeatures: [],
                replacedItemName: 'Unarmed Strike (Pugilist)',
                removedItems: [],
                additionalItems: [],
                priority: 20
            }
        }
    }
};
