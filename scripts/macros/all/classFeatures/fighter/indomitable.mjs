import {automationUtils, dialogUtils, workflowUtils} from '../../../../proxy.mjs';
async function reroll({actor, config, dialog, document: item, message, roll}) {
    if (roll.isSuccess) return;
    if (workflowUtils.getWorkflowProperty(config, 'indomitable')) return;
    if (!item.system.uses.value) return;
    if (!await dialogUtils.confirmUseRollTotal(item, roll.total)) return;
    const formula = automationUtils.getConfigValue(item, 'additionalBonus');
    if (formula?.length) {
        config.rolls ??= [];
        config.rolls.push({parts: [formula]});
    }
    workflowUtils.setWorkflowProperty(config, 'indomitable', true);
    dialog.configure = false;
    message.create = false;
    await workflowUtils.syntheticItemRoll(item);
    return (await actor.rollSavingThrow(config, dialog, message))?.[0];
}
export const indomitable = {
    name: 'Indomitable',
    version: '2.0.4',
    rules: 'all',
    save: [
        {
            pass: 'actorBonus',
            macro: reroll,
            priority: 300
        }
    ],
    config: {
        additionalBonus: {
            default: '@classes.fighter.levels',
            type: 'text',
            label: 'CHRISPREMADES.Config.Bonus',
            category: 'behavior'
        },
        classIdentifier: {
            default: 'fighter',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'behavior'
        }
    },
    scales: [
        {
            identifier: 'indomitable',
            classIdentifier: 'fighter',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'indomitable',
                    type: 'number',
                    scale: {
                        9: {value: 1},
                        13: {value: 2},
                        17: {value: 3}
                    }
                },
                value: {},
                title: 'Indomitable'
            }
        }
    ]
};
