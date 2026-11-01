import {'mantle-of-inspiration' as mantleAll} from '../../../../all.mjs';
export const mantleOfInspiration = {
    name: 'MantleOfInspiration',
    version: '2.1.7',
    rules: '2014',
    config: {
        ...mantleAll.config,
        subclassIdentifier: {
            default: 'glamour',
            type: 'text',
            label: 'CHRISPREMADES.Config.SubclassIdentifier',
            category: 'behavior'
        }
    },
    scales: [
        {
            identifier: 'mantle-of-inspiration',
            data:{
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'mantle-of-inspiration',
                    type: 'number',
                    scale: {
                        3: {value: 5},
                        5: {value: 8},
                        10: {value: 11},
                        15: {value: 14}
                    }
                },
                value: {},
                title: 'Mantle of Inpiration',
                icon: null
            }
        }
    ]
};
