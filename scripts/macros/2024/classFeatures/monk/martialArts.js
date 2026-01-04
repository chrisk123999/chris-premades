import {activityUtils, actorUtils, constants, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    let validateWeaponType = itemUtils.getConfig(item, 'validateWeaponType');
    if (validateWeaponType) {
        let isNatural = workflow.item.system.type.value === 'natural';
        let isUnarmed = constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item));
        if (!isUnarmed && isNatural) return;
        if (['martialM', 'martialR'].includes(workflow.item.system.type.value) && !workflow.item.system.properties.has('lgt')) return;
    }
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
    if (workflowUtils.isAttackType(workflow, 'meleeAttack')) {
        let defaultType = workflow.activity.attack.ability;
        if (!defaultType) defaultType = 'str';
        itemData.system.activities[workflow.activity.id].attack.ability = actorUtils.getBestAbility(workflow.actor, [defaultType, 'dex']);
    }
    workflow.item = await itemUtils.syntheticItem(itemData, workflow.actor);
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
async function grappleShove({trigger, workflow}) {
    let isUnarmed = constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item));
    if (!isUnarmed) return;
    let identifier = activityUtils.getIdentifier(workflow.activity);
    if (!identifier) return;
    if (!['strSave', 'dexSave'].includes(identifier)) return;
    let defaultType = workflow.activity.save.dc.calculation;
    let bestType = actorUtils.getBestAbility(workflow.actor, [defaultType, 'dex']);
    if (bestType === defaultType) return;
    let itemData = genericUtils.duplicate(workflow.item.toObject());
    itemData.system.activities[workflow.activity.id].save.dc.calculation = bestType;
    workflow.item = await itemUtils.syntheticItem(itemData, workflow.actor);
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.fixScales(item);
}
export let martialArts = {
    name: 'Martial Arts',
    version: '1.3.136',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 25
            },
            {
                pass: 'preambleComplete',
                macro: grappleShove,
                priority: 26
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
            default: 'monk',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'martial-arts',
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
                    identifier: 'martial-arts',
                    type: 'dice',
                    distance: {
                        units: ''
                    },
                    scale: {
                        1: {
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
                title: 'Martial Arts'
            }
        }
        
    ]
};