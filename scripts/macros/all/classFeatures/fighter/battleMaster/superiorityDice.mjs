export const superiorityDice = {
    name: 'Superiority Dice',
    version: '2.1.9',
    rules: 'all',
    config: {
        subclassIdentifier: {
            default: 'battle-master',
            type: 'text',
            label: 'CHRISPREMADES.Config.SubclassIdentifier',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'combat-superiority-die',
            classIdentifier: 'battle-master',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'combat-superiority-die',
                    type: 'dice',
                    scale: {
                        3: {
                            number: 1,
                            faces: 8,
                            modifiers: []
                        },
                        10: {
                            number: 1,
                            faces: 10,
                            modifiers: []
                        },
                        18: {
                            number: 1,
                            faces: 12,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Combat Superiority Die',
                icon: null
            }
        }
    ]
};
