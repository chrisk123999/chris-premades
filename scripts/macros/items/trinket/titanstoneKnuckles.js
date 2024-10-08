import {genericUtils} from '../../../utils.js';
export let titanstoneKnucklesD = {
    name: 'Titanstone Knuckles (Dormant)',
    version: '1.0.11'
};
export let titanstoneKnucklesA = {
    name: 'Titanstone Knuckles (Awakened)',
    version: titanstoneKnucklesD.version,
    equipment: {
        enlarge: {
            name: 'Enlarge/Reduce',
            compendium: 'spell',
            duration: {
                units: 'minute',
                value: 10
            },
            override: {
                system: {
                    target: {
                        type: 'self'
                    },
                    range: {
                        units: 'self'
                    }
                },
                flags: {
                    'chris-premades': {
                        titanStone: 1
                    }
                }
            },
            uses: {
                value: 1,
                per: 'lr',
                max: 1,
                recovery: 1
            },
            preparation: 'atwill'
        }
    }
};
export let titanstoneKnucklesE = {
    name: 'Titanstone Knuckles (Exalted)',
    version: titanstoneKnucklesD.version,
    equipment: genericUtils.mergeObject(titanstoneKnucklesA.equipment, {'enlarge.override.flags.chris-premades.titanStone': 2})
};