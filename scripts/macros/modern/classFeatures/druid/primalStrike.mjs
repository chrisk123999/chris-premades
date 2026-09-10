export const primalStrike = {
    name: 'Elemental Fury: Primal Strike',
    version: '2.0.3',
    rules: '2024',
    config: {
        classIdentifier: {
            default: 'druid',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'elemental-fury',
            classIdentifier: 'druid',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'elemental-fury',
                    type: 'dice',
                    scale: {
                        7: {number: 1, faces: 8},
                        15: {number: 2, faces: 8}
                    }
                },
                value: {},
                title: 'Primal Strike'
            }
        }
    ]
};
