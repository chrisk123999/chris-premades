export const warriorOfTheGods = {
    name: 'WarriorOfTheGods',
    version: '2.1.4',
    rules: '2024',
    config: {
        subclassIdentifier: {
            default: 'zealot',
            type: 'text',
            label: 'CHRISPREMADES.Config.SubclassIdentifier',
            category: 'behavior'
        }
    },
    scales: [
        {
            identifier: 'warrior-of-the-gods',
            data:{
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'warrior-of-the-gods',
                    type: 'dice',
                    scale: {
                        3: {
                            number: 4,
                            faces: 12,
                            modifiers: []
                        },
                        6: {
                            number: 5,
                            faces: 12,
                            modifiers: []
                        },
                        12: {
                            number: 6,
                            faces: 12,
                            modifiers: []
                        },
                        17: {
                            number: 7,
                            faces: 12,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Warrior of the Gods',
                icon: null
            }
        }
    ]
};
