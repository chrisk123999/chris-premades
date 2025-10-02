import {itemUtils} from '../../../../../utils.js';
async function added({trigger: {entity: item}}) {
    let subclassIdentifier = itemUtils.getConfig(item, 'subclassIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    if (item.actor.system.scale[subclassIdentifier]?.[scaleIdentifier]) return;
    if (item.actor.system.scale[subclassIdentifier]?.['die']) {
        await itemUtils.setConfig(item, 'scaleIdentifier', 'die');
        return;
    }
    await itemUtils.fixScales(item);
}
export let dreadfulStrikes = {
    name: 'Dreadful Strikes',
    version: '1.3.57',
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
            default: 'fey-wanderer',
            category: 'mechanics'
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'dreadful-strikes',
            category: 'mechanics'
        }
    ],
    scales: [
        {
            classIdentifier: 'subclassIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'dreadful-strikes',
                    type: 'dice',
                    distance: {
                        units: ''
                    },
                    scale: {
                        3: {
                            number: 1,
                            faces: 4,
                            modifiers: []
                        },
                        11: {
                            number: 1,
                            faces: 6,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Dreadful Strikes'
            }
        }
    ]
};