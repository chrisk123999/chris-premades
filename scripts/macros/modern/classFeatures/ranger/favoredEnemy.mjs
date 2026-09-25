export const favoredEnemy = {
    name: 'Favored Enemy',
    version: '2.0.0',
    rules: '2024',
    config: {
        classIdentifier: {
            default: 'ranger',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'favored-enemy',
            classIdentifier: 'ranger',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'favored-enemy',
                    type: 'number',
                    scale: {
                        1: {
                            value: 2
                        },
                        5: {
                            value: 3
                        },
                        9: {
                            value: 4
                        },
                        13: {
                            value: 5
                        },
                        17: {
                            value: 6
                        }
                    }
                },
                value: {},
                title: 'Favored Enemy',
                icon: null
            }
        }
    ]
};
