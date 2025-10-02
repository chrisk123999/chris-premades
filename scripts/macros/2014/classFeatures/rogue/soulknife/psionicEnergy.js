import {genericUtils, itemUtils} from '../../../../../utils.js';
async function added({trigger: {entity: item}}) {
    let subclassIdentifier = itemUtils.getConfig(item, 'subclassIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    if (item.actor.system.scale[subclassIdentifier]?.[scaleIdentifier]) return;
    if (item.actor.system.scale[subclassIdentifier]?.['die']) {
        await itemUtils.setConfig(item, 'scaleIdentifier', 'die');
        await genericUtils.update(item, 'system.activities.dnd5eactivity000.damage.parts.0.custom.formula', '@scale.' + subclassIdentifier + '.die');
        return;
    }
    await itemUtils.fixScales(item);
}
export let psionicEnergy = {
    name: 'Psionic Power: Psionic Energy',
    aliases: ['Psionic Power'],
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
            default: 'soulknife',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'energy-die',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: [
        {
            classIdentifier: 'subclassIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'energy-die',
                    type: 'dice',
                    distance: {
                        units: ''
                    },
                    scale: {
                        3: {
                            number: 1,
                            faces: 6,
                            modifiers: []
                        },
                        5: {
                            number: 1,
                            faces: 8,
                            modifiers: []
                        },
                        11: {
                            number: 1,
                            faces: 10,
                            modifiers: []
                        },
                        17: {
                            number: 1,
                            faces: 12,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Energy Die'
            }
        }
    ]
};