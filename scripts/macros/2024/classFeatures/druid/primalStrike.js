import {combatUtils, constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflow.activity.type !== 'attack') return;
    // Natural weapon attacks, monster features
    if (workflow.item.type !== 'weapon' && workflow.item.system.type?.value !== 'monster') return;
    if (!item.system.uses.value) return;
    if (!combatUtils.isOwnTurn(workflow.token)) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    let bonusFormula = workflow.actor.system.scale[classIdentifier]?.[scaleIdentifier]?.formula ?? '1d8';
    let selection = await dialogUtils.selectDamageType(itemUtils.getConfig(item, 'damageTypes'), workflow.item.name, genericUtils.format('CHRISPREMADES.Dialog.UseWeaponDamageExtra', {itemName: item.name, bonusFormula: bonusFormula}), {addNo: true});
    if (!selection || selection === 'no') return;
    await workflowUtils.bonusDamage(workflow, bonusFormula, {damageType: selection});
    await workflowUtils.completeActivityUse(item.system.activities.contents[0], {}, {configure: false});
}
export let elementalFuryPrimalStrike = {
    name: 'Elemental Fury: Primal Strike',
    version: '1.3.83',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'druid',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'elemental-fury',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['cold', 'fire', 'lightning', 'thunder'],
            options: constants.damageTypeOptions,
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
                    distance: {
                        units: ''
                    },
                    identifier: 'elemental-fury',
                    type: 'dice',
                    scale: {
                        7: {
                            number: 1,
                            faces: 8,
                            modifiers: []
                        },
                        15: {
                            number: 2,
                            faces: 8,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Elemental Fury',
                icon: null
            }
        }
    ]
};