import {'wild-shape' as wildShapeAll} from '../../../all.mjs';
export const wildShape = {
    name: wildShapeAll.name,
    version: wildShapeAll.version,
    rules: '2024',
    scales: [
        ...wildShapeAll.scales,
        {
            identifier: 'wild-shape-uses',
            classIdentifier: 'druid',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'wild-shape-uses',
                    type: 'number',
                    scale: {
                        2: {value: 2},
                        6: {value: 3},
                        17: {value: 4}
                    }
                },
                value: {},
                title: 'Wild Shape'
            }
        },
        {
            identifier: 'known-forms',
            classIdentifier: 'druid',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'known-forms',
                    type: 'number',
                    scale: {
                        2: {value: 4},
                        4: {value: 6},
                        8: {value: 8}
                    }
                },
                value: {},
                title: 'Known Forms'
            }
        }
    ]
};
