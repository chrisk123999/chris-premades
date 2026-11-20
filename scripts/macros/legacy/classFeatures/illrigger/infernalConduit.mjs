import {actorUtils, automationUtils, documentUtils, genericUtils, workflowUtils} from '../../../../proxy.mjs';
async function notSelf({workflow}) {
    if (!workflow.targets.documents.some(target => target.actor === workflow.actor)) return;
    genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfernalConduit.Self', {type: 'info'});
    workflow.aborted = true;
    return true;
}
async function exhaust(item, target) {
    const config = automationUtils.getConfigValues(item, ['classIdentifier', 'exhaustionLevel']);
    if ((item.actor.classes[config.classIdentifier]?.system.levels ?? 0) < config.exhaustionLevel) return;
    const fromConduit = Math.min(target.actor.flags['chris-premades']?.infernalConduitExhaustion ?? 0, target.actor.system.attributes.exhaustion ?? 0);
    if (fromConduit >= 3) return;
    await actorUtils.addExhaustion(target.actor, 1);
    await documentUtils.setFlag(target.actor, 'chris-premades', 'infernalConduitExhaustion', fromConduit + 1);
}
async function finished({document: item, workflow}) {
    const target = workflow.targets.documents[0];
    if (!target || !workflow.token) return;
    const total = workflow.damageRolls.reduce((sum, roll) => sum + roll.total, 0);
    if (workflow.activity.identifier === 'devour') {
        const dealt = workflow.damageList?.find(ditem => ditem.actorUuid === target.actor.uuid)?.totalDamage ?? 0;
        if (dealt) await workflowUtils.applyDamage([workflow.token.document], dealt, 'healing');
        if (workflow.failedSaves.has(target)) await exhaust(item, target);
        return;
    }
    await workflowUtils.applyDamage([target], workflow.failedSaves.has(target) ? total : Math.floor(total / 2), 'healing');
    await workflow.actor.applyDamage(total);
    if (workflow.actor.system.attributes.hp.value) return;
    await actorUtils.applyConditions(workflow.actor, ['unconscious']);
    await documentUtils.update(workflow.actor, {'system.attributes.death.success': 3});
}
export const infernalConduit = {
    name: 'Infernal Conduit',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: notSelf,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: finished,
            priority: 50
        }
    ],
    config: {
        classIdentifier: {
            default: 'illrigger',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        },
        exhaustionLevel: {
            default: 11,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.InfernalConduit.ExhaustionLevel',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'infernal-conduit',
            classIdentifier: 'illrigger',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {units: ''},
                    identifier: 'infernal-conduit',
                    type: 'number',
                    scale: {6: {value: 3}, 7: {value: 4}, 9: {value: 5}, 11: {value: 6}, 13: {value: 7}, 15: {value: 8}, 17: {value: 9}, 19: {value: 10}}
                },
                value: {},
                title: 'Infernal Conduit Dice'
            }
        }
    ]
};
