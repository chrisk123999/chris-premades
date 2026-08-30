export const divineStrike = {
    name: 'Blessed Strikes: Divine Strike',
    version: '2.0.3',
    rules: '2024',
    config: {
        classIdentifier: {
            default: 'cleric',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'divine-strike',
            classIdentifier: 'cleric',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'divine-strike',
                    type: 'dice',
                    scale: {
                        7: {number: 1, faces: 8},
                        14: {number: 2, faces: 8}
                    }
                },
                value: {},
                title: 'Divine Strike'
            }
        }
    ]
};
