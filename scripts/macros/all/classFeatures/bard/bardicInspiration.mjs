/* 
*  WIP - integrate with CAT optional bonus dialog 
*  Called events - 1 for granting, 1 for using
*/
export const bardicInspiration = {
    name: 'Bardic Inspiration',
    version: '2.0.2',
    rules: 'all',
    notes: 'This automation is incomplete.', 
    config: {
        bonus: {
            default: '@scale.bard.inspiration',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'behavior'
        },
        classIdentifier: {
            default: 'bard',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'behavior'
        }
    },
    scales: [
        {
            identifier: 'inspiration',
            classIdentifier: 'bard',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'inspiration',
                    type: 'dice',
                    scale: {
                        1: {number: 1, faces: 6},
                        5: {number: 1, faces: 8},
                        10: {number: 1, faces: 10},
                        15: {number: 1, faces: 12}
                    }
                },
                value: {},
                title: 'Bardic Inspiration'
            }
        }
    ]
};
