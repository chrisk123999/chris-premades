export const dreadfulStrikes = {
    name: 'Dreadful Strikes',
    version: '2.0.0',
    rules: 'all',
    config: {
        subclassIdentifier: {
            default: 'fey-wanderer',
            type: 'text',
            label: 'CHRISPREMADES.Config.SubclassIdentifier',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'dreadful-strikes',
            classIdentifier: 'fey-wanderer',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'dreadful-strikes',
                    type: 'dice',
                    scale: {
                        3: {
                            number: 1,
                            faces: 4,
                            modifiers: []
                        },
                        11: {
                            number: 1,
                            faces: 6,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Dreadful Strikes',
                icon: null
            }
        }
    ]
};
