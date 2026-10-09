import {automationUtils, rollUtils, workflowUtils} from '../../../../proxy.mjs';
async function critical({document: item, workflow}) {
    if (!workflow.isCritical) return;
    if (!workflowUtils.isAttackType(workflow, 'meleeWeaponAttack')) return;
    const faces = workflow.damageRolls[0].dice[0]?.faces;
    if (!faces) return;
    const dice = automationUtils.getConfigValue(item, 'bonus');
    const bonusDice = (await rollUtils.rollDice(dice, {document: item})).total;
    if (!bonusDice) return;
    workflow.damageRolls[0] = await rollUtils.addToRoll(workflow.damageRolls[0], bonusDice + 'd' + faces);
    await workflow.setDamageRolls(workflow.damageRolls);
    await workflowUtils.completeItemUse(item);
}
export const brutalCritical = {
    name: 'Brutal Critical',
    version: '2.0.2',
    rules: '2014',
    roll: [
        {
            pass: 'actorDamageRoll',
            macro: critical,
            priority: 200
        }
    ],
    config: {
        bonus: {
            default: '@scale.barbarian.brutal-critical',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'behavior'
        },
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
