export const psionicEnergy = {
    name: 'Psionic Power: Psionic Energy',
    version: '2.0.0',
    rules: '2014',
    config: {
        subclassIdentifier: {
            default: 'soulknife',
            type: 'text',
            label: 'CHRISPREMADES.Config.SubclassIdentifier',
            category: 'behavior'
        }
    },
    scales: [
        {
            identifier: 'energy-die',
            classIdentifier: 'soulknife',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'energy-die',
                    type: 'dice',
                    distance: {
                        units: ''
                    },
                    scale: {
                        3: {
                            number: 1,
                            faces: 6,
                            modifiers: []
                        },
                        5: {
                            number: 1,
                            faces: 8,
                            modifiers: []
                        },
                        11: {
                            number: 1,
                            faces: 10,
                            modifiers: []
                        },
                        17: {
                            number: 1,
                            faces: 12,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Energy Die'
            }
        }
    ]
};
