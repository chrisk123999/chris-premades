import {circleOfMortality as mortalityAll} from '../../../../all/classFeatures/cleric/grave/circleOfMortality.mjs';
export const circleOfMortality = {
    name: 'Circle of Mortality',
    version: '2.1.11',
    rules: '2024',
    roll: mortalityAll.roll,
    config: {
        ...mortalityAll.config,
        subclassIdentifier: {
            default: 'grave-domain',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SubclassIdentifier'
        }
    },
    scales: [
        {
            identifier: 'pull-of-death',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'pull-of-death',
                    type: 'dice',
                    scale: {
                        3: {number: 1, faces: 4},
                        11: {number: 1, faces: 6}
                    }
                },
                title: 'Pull of Death'
            }
        }
    ]
};
