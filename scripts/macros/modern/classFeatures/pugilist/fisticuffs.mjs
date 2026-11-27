import {genericUtils} from '../../../../proxy.mjs';
function armored(actor) {
    const {equippedArmor, equippedShield} = actor.system.attributes.ac;
    return !!equippedShield || ['medium', 'heavy'].includes(equippedArmor?.system.type.value);
}
function mastery({data: {workflow, masteries}}) {
    if (workflow.item.system.type?.value !== 'improv' || masteries.includes('sap') || armored(workflow.actor)) return;
    masteries.push('sap');
}
function gate({document: item, activity}) {
    if (activity.identifier !== 'bonus-unarmed-strike' || !armored(item.actor)) return;
    genericUtils.notify('CHRISPREMADES.Macros.Modern.Fisticuffs.Armored', {type: 'info'});
    return true;
}
export const fisticuffs = {
    name: 'Fisticuffs',
    version: '2.1.11',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: gate,
            priority: 10
        }
    ],
    called: [
        {
            pass: 'actorWeaponMastery',
            macro: mastery,
            priority: 50
        }
    ],
    config: {
        classIdentifier: {
            default: 'pugilist',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'fisticuffs',
            classIdentifier: 'pugilist',
            data: {
                type: 'ScaleValue',
                configuration: {distance: {units: ''}, identifier: 'fisticuffs', type: 'dice', scale: {1: {number: 1, faces: 8}, 5: {number: 1, faces: 10}, 11: {number: 1, faces: 12}, 17: {number: 2, faces: 6}}},
                value: {},
                title: 'Fisticuffs'
            }
        },
        {
            identifier: 'moxie',
            classIdentifier: 'pugilist',
            data: {
                type: 'ScaleValue',
                configuration: {distance: {units: ''}, identifier: 'moxie', type: 'number', scale: {2: {value: 2}, 4: {value: 3}, 6: {value: 4}, 8: {value: 5}, 10: {value: 6}, 12: {value: 7}, 14: {value: 8}, 16: {value: 9}, 18: {value: 10}, 19: {value: 11}, 20: {value: 12}}},
                value: {},
                title: 'Moxie'
            }
        }
    ]
};
