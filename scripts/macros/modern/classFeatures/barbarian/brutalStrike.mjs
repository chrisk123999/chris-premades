import {actorUtils, automationUtils, combatUtils, DamageBonus, dialogUtils, rollUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
async function preAttack({document: activity, identifier, workflow}) {
    if (!activity.item.system.uses.value) return;
    if (workflow.activity.ability !== 'str') return;
    if (workflow.disadvantage || !workflow.advantage) return;
    if (!combatUtils.isOwnTurn(workflow.token) || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const effect = actorUtils.getEffectByIdentifier(workflow.actor, 'recklessAttackEffect');
    if (!effect || !effect.active) return;
    const activities = activity.item.system.activities.contents.filter(a => a.id !== activity.id);
    const data = Object.create(Object.prototype, {
        activities: {get: () => activities, enumerable: true},
        workflow: {value: workflow, enumerable: true}
    });
    await automationUtils.calledEvent('brutalStrike', workflow.actor, {canOverlap: true, multiResult: true, data});
    const choices = activities.filter(a => a instanceof dnd5e.dataModels.activity.BaseActivityData);
    if (!choices?.length) return;
    const config = automationUtils.getConfigValues(activity.item, ['count', 'damage']);
    config.count = (await rollUtils.rollDice(config.count, {document: activity.item})).total;
    const options = {addNoneDocument: true, checkbox: true, max: config.count};
    const choice = await dialogUtils.selectDocumentDialog(activity.item.name, _loc('CHRISPREMADES.Macros.Modern.BrutalStrike.Use', {item: activity.item.name}), choices, options);
    if (!choice) return;
    const chosen = [];
    if (config.count > 1) {
        for (const result of choice)
            if (result.amount) chosen.push(result.document);
    }
    else chosen.push(choice);
    await workflowUtils.completeActivityUse(activity);
    workflowUtils.setWorkflowProperty(workflow, 'brutalStrikesActivities', chosen);
    workflowUtils.setWorkflowProperty(workflow, 'brutalStrikesDamage', config.damage);
    workflow.tracker.advantage.suppress(identifier, activity.item.name);
}
async function damage({document: activity, workflow}) {
    const formula = workflowUtils.getWorkflowProperty(workflow, 'brutalStrikesDamage');
    if (!formula || !workflow.hitTargets.size) return;
    return new DamageBonus(activity, {formula, optional: false}).initialize(workflow);
}
async function doStrike({workflow}) {
    const activities = workflowUtils.getWorkflowProperty(workflow, 'brutalStrikesActivities');
    if (!activities?.length || !workflow.hitTargets.size) return;
    const targets = Array.from(workflow.hitTargets.map(i => i.document));
    for (const activity of activities) await workflowUtils.completeActivityUse(activity, targets);
}
async function forcefulBlowPush({document: activity, workflow}) {
    const distanceFormula = automationUtils.getConfigValue(activity.item, 'push');
    const distance = (await rollUtils.rollDice(distanceFormula, {document: activity})).total;
    for (const token of workflow.targets)
        await tokenUtils.slideToken(token.document, {sourceToken: workflow.token.document, distance});
}
export const brutalStrike = {
    name: 'Brutal Strike',
    version: '2.0.2',
    rules: '2024',
    notes: 'Use the "actorBrutalStrike" called event (async) to modify the array of activities used as choices.\n\tData available: activities, workflow.',
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: preAttack,
            priority: 200
        },
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 200
        },
        {
            pass: 'actorRollFinished',
            macro: doStrike,
            priority: 200
        }
    ],
    config: {
        classIdentifier: {
            default: 'barbarian',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'behavior'
        },
        count: {
            default: '@scale.barbarian.brutal-strike-count',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Modern.BrutalStrike.Choice',
            category: 'behavior'
        },
        damage: {
            default: '@scale.barbarian.brutal-strike',
            type: 'text',
            label: 'CHRISPREMADES.Config.DamageBonus',
            category: 'behavior'
        },
        push: {
            default: '15',
            type: 'text',
            label: 'CHRISPREMADES.Config.Distance',
            category: 'behavior'
        }
    },
    scales: [
        {
            identifier: 'brutal-strike',
            classIdentifier: 'barbarian',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'brutal-strike',
                    type: 'dice',
                    scale: {
                        9: {number: 1, faces: 10},
                        17: {number: 2, faces: 10}
                    }
                },
                value: {},
                title: 'Brutal Strike'
            }
        },
        {
            identifier: 'brutal-strike-count',
            classIdentifier: 'barbarian',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'brutal-strike-count',
                    type: 'number',
                    scale: {
                        9: {value: 1},
                        17: {value: 2}
                    }
                },
                value: {},
                title: 'Brutal Strike Choice Count'
            }
        }
    ]
};
export const forcefulBlow = {
    name: 'Forceful Blow',
    version: brutalStrike.version,
    rules: brutalStrike.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: forcefulBlowPush,
            priority: 50
        }
    ]
};
