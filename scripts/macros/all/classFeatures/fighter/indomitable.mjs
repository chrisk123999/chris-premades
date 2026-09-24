export const indomitable = {
    name: 'Indomitable',
    version: '2.0.4',
    rules: 'all',
    config: {
        classIdentifier: {
            default: 'fighter',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'behavior'
        }
    },
    scales: [
        {
            identifier: 'indomitable',
            classIdentifier: 'fighter',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'indomitable',
                    type: 'number',
                    scale: {
                        9: {value: 1},
                        13: {value: 2},
                        17: {value: 3}
                    }
                },
                value: {},
                title: 'Indomitable'
            }
        }
    ]
};
