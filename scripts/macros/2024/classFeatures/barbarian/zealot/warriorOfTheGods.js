import {genericUtils} from '../../../../../utils.js';

async function updateScales(origItem, newItemData) {
    let { classIdentifier=null, scaleIdentifier=null } = genericUtils.getValidScaleIdentifier(origItem.actor, newItemData, warriorOfTheGods.scaleAliases, 'zealot');
    if (!scaleIdentifier) return;
    genericUtils.setProperty(newItemData, 'flags.chris-premades.config.scaleIdentifier', scaleIdentifier);
    genericUtils.setProperty(newItemData, 'system.uses.max', `@scale.${classIdentifier}.${scaleIdentifier}.number`);
}
export let warriorOfTheGods = {
    name: 'Warrior of the Gods',
    version: '1.1.28',
    rules: 'modern',
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'zealot',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'warrior-of-the-gods',
            category: 'homebrew',
            homebrew: true
        }
    ],
    early: updateScales,
    scaleAliases: ['warrior-of-the-gods', 'pool'],
    scales: [
        {
            type: 'ScaleValue',
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'warrior-of-the-gods',
                    type: 'dice',
                    scale: {
                        3: {
                            number: 4,
                            faces: 12,
                            modifiers: []
                        },
                        6: {
                            number: 5,
                            faces: 12,
                            modifiers: []
                        },
                        12: {
                            number: 6,
                            faces: 12,
                            modifiers: []
                        },
                        17: {
                            number: 7,
                            faces: 12,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Warrior of the Gods'
            }
        }
    ]
};