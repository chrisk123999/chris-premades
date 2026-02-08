import {genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    let validateWeaponType = itemUtils.getConfig(item, 'validateWeaponType');
    if (validateWeaponType && !['simpleM', 'improv'].includes(workflow.item.system.type.value)) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    let scale = workflow.actor.system.scale[classIdentifier]?.[scaleIdentifier];
    if (!scale) return;
    let baseMaxDamage = rollUtils.rollDiceSync(workflow.item.system.damage.base.formula, {entity: workflow.item, options: {maximize: true}});
    let scaleMaxDamage = rollUtils.rollDiceSync(scale.formula, {options: {maximize: true}});
    let itemData = genericUtils.duplicate(workflow.item.toObject());
    if (baseMaxDamage.total <= scaleMaxDamage.total) {
        itemData.system.damage.base.denomination = scale.faces;
        itemData.system.damage.base.number = scale.number;
    }
    if (workflow.item.system.type.value === 'improv') {
        itemData.system.proficient = 1;
        itemData.system.mastery = 'sap';
    }
    workflow.item = await itemUtils.syntheticItem(itemData, workflow.actor);
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.fixScales(item);
}
export let fisticuffs = {
    name: 'Fisticuffs',
    version: '1.4.25',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 25
            }
        ]
    },
    item: [
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
            value: 'validateWeaponType',
            label: 'CHRISPREMADES.Macros.MartialArts.ValidateWeaponType',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'pugilist',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'fisticuffs',
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
                    identifier: 'fisticuffs',
                    type: 'dice',
                    distance: {
                        units: ''
                    },
                    scale: {
                        1: {
                            number: 1,
                            faces: 8,
                            modifiers: []
                        },
                        5: {
                            number: 1,
                            faces: 10,
                            modifiers: []
                        },
                        11: {
                            number: 1,
                            faces: 12,
                            modifiers: []
                        },
                        17: {
                            number: 2,
                            faces: 6,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Fisticuffs'
            }
        } 
    ]
};
