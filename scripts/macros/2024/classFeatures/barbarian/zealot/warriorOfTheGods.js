import {genericUtils, itemUtils} from '../../../../../utils.js';
async function added({trigger: {entity: item}}) {
    let subclassIdentifier = itemUtils.getConfig(item, 'subclassIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    if (item.actor.system.scale[subclassIdentifier]?.[scaleIdentifier]) return;
    if (item.actor.system.scale[subclassIdentifier]?.['pool']) {
        await itemUtils.setConfig(item, 'scaleIdentifier', 'pool');
        await genericUtils.update(item, 'system.uses.max', '@scale.' + subclassIdentifier + '.pool.number');
        return;
    }
    await itemUtils.fixScales(item);
}
export let warriorOfTheGods = {
    name: 'Warrior of the Gods',
    version: '1.3.57',
    rules: 'modern',
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ],
    config: [
        {
            value: 'subclassIdentifier',
            label: 'CHRISPREMADES.Config.SubclassIdentifier',
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
    scales: [
        {
            type: 'ScaleValue',
            classIdentifier: 'subclassIdentifier',
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