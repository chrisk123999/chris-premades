import {effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function change({trigger: {item}}) {
    if (item.type != 'equipment') return;
    if (item.system.type?.value != 'heavy') return;
    if (!item.actor) return;
    let effect = effectUtils.getEffectByIdentifier(item.actor, 'unarmoredMovementEffect');
    if (!effect) return;
    let invalidTypes = ['heavy', 'medium', 'light', 'shield'];
    let armor = item.actor.items.find(i => i.system.equipped && i.type === 'equipment' && invalidTypes.includes(item.system.type?.value));
    if (armor && !effect.disabled) await genericUtils.update(effect, {disabled: true});
    if (!armor && effect.disabled) await genericUtils.update(effect, {disabled: false});
}
async function added({trigger: {entity: item}}) {
    await itemUtils.fixScales(item);
}
export let unarmoredMovement = {
    name: 'Unarmored Movement',
    version: '1.3.138',
    rules: 'modern',
    item: [
        {
            pass: 'actorEquipped',
            macro: change
        },
        {
            pass: 'actorUnequipped',
            macro: change
        },
        {
            pass: 'created',
            macro: added,
            priority: 45
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 45
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 45
        }
    ],
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'monk',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'unarmored-movement',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: [
        {
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'unarmored-movement',
                    type: 'number',
                    distance: {
                        units: ''
                    },
                    scale: {
                        2: {
                            value: 10
                        },
                        6: {
                            value: 15
                        },
                        10: {
                            value: 20
                        },
                        14: {
                            value: 25
                        },
                        18: {
                            value: 30
                        }
                    }
                },
                value: {},
                title: 'Unarmored Movement'
            }
        }
    ]
};