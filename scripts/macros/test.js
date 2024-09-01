import {actorUtils, effectUtils, genericUtils, tokenUtils} from '../utils.js';

export let test = {
    name: 'test',
    version: '0.12.0',
    equipment: {
        armorOfAgathys: {
            name: 'Armor of Agathys',
            uses: {
                value: 3,
                per: 'lr',
                max: 3
            },
            compendium: 'spell',
            preparation: 'atwill'
        }
    }
};