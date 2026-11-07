import {actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils, genericUtils, queryUtils, workflowUtils} from '../../../proxy.mjs';
function isKnockOutHit(ditem, workflow, attackTypes) {
    return ditem.isHit && ditem.oldHP > 0 && ditem.newHP === 0 && (attackTypes ?? ['melee']).includes(workflow.activity?.attack?.type?.value);
}
function knockOutTarget(ditem, workflow, rules) {
    if (rules !== '2014') workflowUtils.preventZeroHP(ditem);
    const targets = workflowUtils.getWorkflowProperty(workflow, 'knockOut') ?? [];
    workflowUtils.setWorkflowProperty(workflow, 'knockOut', [...targets, {actorUuid: ditem.actorUuid, rules}]);
}
async function early({document: activity, workflow}) {
    const sourceEffect = activity.item.effects.find(effect => effect.flags.cat?.identifier === 'knockOutEffect');
    if (!sourceEffect) return;
    const effectData = documentUtils.getEffectData(activity.item, sourceEffect.id, {duration: {value: 1, units: 'seconds'}});
    genericUtils.setProperty(effectData, 'flags.chris-premades.knockOut', {rules: documentUtils.getRules(activity.item), attackTypes: automationUtils.getConfigValue(activity.item, 'attackTypes')});
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
async function late({workflow}) {
    const effect = actorUtils.getEffectByIdentifier(workflow.actor, 'knockOutEffect');
    if (effect) await documentUtils.deleteDocument(effect);
}
async function damage({document: effect, ditem, workflow}) {
    if (!isKnockOutHit(ditem, workflow, effect.flags['chris-premades']?.knockOut?.attackTypes)) return;
    knockOutTarget(ditem, workflow, effect.flags['chris-premades']?.knockOut?.rules);
}
async function prompt({document: item, ditem, workflow}) {
    if (!automationUtils.getConfigValue(item, 'promptOnZero') || !isKnockOutHit(ditem, workflow, automationUtils.getConfigValue(item, 'attackTypes'))) return;
    if (actorUtils.getEffectByIdentifier(workflow.actor, 'knockOutEffect')) return;
    const prompted = workflowUtils.getWorkflowProperty(workflow, 'knockOutPrompted') ?? [];
    if (prompted.includes(ditem.actorUuid)) return;
    workflowUtils.setWorkflowProperty(workflow, 'knockOutPrompted', [...prompted, ditem.actorUuid]);
    const name = fromUuidSync(ditem.actorUuid)?.name ?? '';
    if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.All.KnockOut.Prompt', {name}), {userId: queryUtils.firstOwner(workflow.actor, true)})) return;
    knockOutTarget(ditem, workflow, documentUtils.getRules(item));
}
async function done({workflow}) {
    const targets = workflowUtils.getWorkflowProperty(workflow, 'knockOut');
    if (!targets?.length) return;
    workflowUtils.setWorkflowProperty(workflow, 'knockOut', []);
    for (const {actorUuid, rules} of targets) {
        const actor = await fromUuid(actorUuid);
        if (!actor) continue;
        if (rules === '2014') {
            const dead = actorUtils.getEffectByStatusID(actor, 'dead');
            if (dead) await documentUtils.deleteDocument(dead);
            await actorUtils.applyConditions(actor, ['unconscious', 'stable'], {overlay: true});
        } else await actorUtils.applyConditions(actor, ['unconscious'], {overlay: true});
    }
}
export const knockOut = {
    name: 'Knock Out',
    version: '2.1.8',
    rules: 'all',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: early,
            priority: 40
        },
        {
            pass: 'activityRollFinished',
            macro: late,
            priority: 60
        }
    ],
    config: {
        attackTypes: {
            default: ['melee'],
            type: 'select-many',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.All.KnockOut.AttackTypes',
            hint: 'CHRISPREMADES.Macros.All.KnockOut.AttackTypesHint',
            options: [{value: 'melee', label: 'DND5E.ATTACK.Type.Melee'}, {value: 'ranged', label: 'DND5E.ATTACK.Type.Ranged'}]
        },
        promptOnZero: {
            default: false,
            type: 'checkbox',
            category: 'mechanics',
            label: 'CHRISPREMADES.Macros.All.KnockOut.PromptOnZero',
            hint: 'CHRISPREMADES.Macros.All.KnockOut.PromptOnZeroHint'
        }
    }
};
export const knockOutEffect = {
    name: 'Knock Out: Effect',
    version: knockOut.version,
    rules: knockOut.rules,
    roll: [
        {
            pass: 'actorDamageComplete',
            macro: damage,
            priority: 10,
            canOverlap: true
        },
        {
            pass: 'actorRollFinished',
            macro: done,
            priority: 50,
            canOverlap: true
        }
    ]
};
export const knockOutPrompt = {
    name: 'Knock Out: Prompt',
    version: knockOut.version,
    rules: knockOut.rules,
    roll: [
        {
            pass: 'actorDamageComplete',
            macro: prompt,
            priority: 10,
            canOverlap: true
        },
        {
            pass: 'actorRollFinished',
            macro: done,
            priority: 50,
            canOverlap: true
        }
    ]
};
