export let warriorOfTheGods = {
    name: 'Warrior of the Gods',
    version: '1.1.28',
    rules: 'modern',
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'zealot',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'warrior-of-the-gods',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: [
        {
            type: 'ScaleValue',
            configuration: {
                identifier: 'warrior-of-the-gods',
                type: 'dice',
                distance: {
                    units: ''
                },
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
            title: 'Warrior of the Gods'
        }
    ]
};