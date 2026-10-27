import {workflowUtils} from '../../../../proxy.mjs';
// uses flags.dnd5e.meleeCriticalDamageDice, this macro just shows a card for attribution
async function critical({document: item, workflow}) {
    if (!workflow.isCritical) return;
    if (!workflowUtils.isAttackType(workflow, 'meleeWeaponAttack')) return;
    await workflowUtils.completeItemUse(item);
}
export const brutalCritical = {
    name: 'Brutal Critical',
    version: '2.1.4',
    rules: '2014',
    roll: [
        {
            pass: 'actorDamageRoll',
            macro: critical,
            priority: 200
        }
    ],
    config: {
        classIdentifier: {
            default: 'barbarian',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'behavior'
        }
    },
    scales: [
        {
            identifier: 'brutal-critical',
            classIdentifier: 'barbarian',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'brutal-critical',
                    type: 'number',
                    scale: {
                        9: {value: 1},
                        13: {value: 2},
                        17: {value: 3}
                    }
                },
                value: {},
                title: 'Brutal Critical Dice'
            }
        }
    ]
};
