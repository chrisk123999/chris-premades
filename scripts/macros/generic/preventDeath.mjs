import {activityUtils, actorUtils, automationUtils, constants, dialogUtils, documentUtils, Logging, queryUtils, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function damage({document, ditem, targetToken, workflow}) {
    if (!ditem.isHit || ditem.oldHP <= 0) return;
    const resultingHP = ditem.oldHP + (ditem.oldTempHP ?? 0) - ditem.totalDamage;
    if (resultingHP > 0) return;
    const actor = targetToken.actor;
    const maxHP = actor.system.attributes.hp.effectiveMax;
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'preventDeath', Object.keys(preventDeath.genericConfig));
    if (!config.killedOutright && resultingHP <= -maxHP) return;
    if (config.deathOnly && resultingHP > -maxHP) return;
    if (config.excludeCritical && workflow.isCritical) return;
    if (config.excludeDamageTypes.length && workflowUtils.getDamageTypes(workflow.damageRolls).intersects(new Set(config.excludeDamageTypes))) return;
    if (config.healingTraits && actorUtils.checkTrait(actor, 'di', 'healing')) return;
    if (!document.system.uses.value) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(document), 'No uses remaining.');
    const selection = await dialogUtils.confirmUseItem(document, {userId: queryUtils.firstOwner(document.actor, true)});
    if (!selection) return;
    const saveActivity = document.system.activities.get(config.saveActivity);
    if (saveActivity) {
        const activityData = config.dcFromDamage
            ? activityUtils.getSaveDCModifiedActivityData(saveActivity, (saveActivity.save.dc.value ?? 0) + ditem.totalDamage)
            : saveActivity.toObject();
        const saveWorkflow = await workflowUtils.syntheticActivityDataRoll(activityData, document, [targetToken]);
        if (saveWorkflow?.failedSaves.count) return;
    }
    let targetHP = config.targetHP ? Math.max(rollUtils.rollDiceSync(config.targetHP, {document}).total, 1) : 1;
    if (config.healingTraits && actorUtils.checkTrait(actor, 'dr', 'healing')) targetHP = Math.max(Math.floor(targetHP / 2), 1);
    workflowUtils.preventZeroHP(ditem, {targetHP});
    const useActivity = document.system.activities.get(config.useActivity);
    if (useActivity) await workflowUtils.completeActivityUse(useActivity, [targetToken]);
    else if (config.display && !saveActivity) await workflowUtils.completeItemUse(document, [targetToken]);
    await automationUtils.calledEvent('preventDeath', document.actor, {canOverlap: true, data: {item: document, workflow}});
}
function reactionSpent(document) {
    const activity = document.system.activities.get(automationUtils.getGenericConfigValue(document, 'chris-premades', 'preventDeath', 'useActivity'));
    return activity?.activation.type === 'reaction' && actorUtils.hasUsedReaction(document.actor);
}
async function selfDamage({document, ditem, targetToken, workflow}) {
    if (automationUtils.getGenericConfigValue(document, 'chris-premades', 'preventDeath', 'othersOnly') || reactionSpent(document)) return;
    await damage({document, ditem, targetToken, workflow});
}
async function nearbyDamage({document, ditem, targetToken, workflow}) {
    if (!targetToken?.actor || targetToken.actor === document.actor) return;
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'preventDeath', ['range', 'alliesOnly']);
    if (!Number(config.range)) return;
    const ownerToken = actorUtils.getFirstToken(document.actor);
    if (!ownerToken || ownerToken.parent !== targetToken.parent || !tokenUtils.isWithinDistance(ownerToken, targetToken, Number(config.range))) return;
    if (config.alliesOnly && tokenUtils.isEnemy(ownerToken, targetToken)) return;
    if (reactionSpent(document)) return;
    await damage({document, ditem, targetToken, workflow});
}
/**
 * Offers to use this item when a hit would drop a creature from above 0 hit points to 0, and keeps it above 0
 * instead. The item needs a use remaining, and each trigger asks the owner to confirm. Once it keeps a creature up, it
 * runs the `preventDeath` called event with the item and the workflow.
 */
export const preventDeath = {
    rules: 'all',
    version: '2.1.10',
    category: 'mechanics',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: selfDamage,
            priority: 150,
            canOverlap: true
        },
        {
            pass: 'sceneDamageComplete',
            macro: nearbyDamage,
            thirdParty: true,
            priority: 150,
            canOverlap: true
        }
    ],
    genericConfig: {
        killedOutright: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.InstantDeath',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.KilledOutright.Hint'
        },
        deathOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.DeathOnly.Label',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.DeathOnly.Hint'
        },
        saveActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.SaveActivity.Label',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.SaveActivity.Hint'
        },
        dcFromDamage: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.DCFromDamage',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.DcFromDamage.Hint'
        },
        excludeCritical: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.ExcludeCritical.Label',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.ExcludeCritical.Hint'
        },
        excludeDamageTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.ExcludeDamageTypes.Label',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.ExcludeDamageTypes.Hint',
            get options() { return constants.damageTypeOptions; }
        },
        display: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Display',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.Display.Hint'
        },
        targetHP: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.TargetHP.Label',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.TargetHP.Hint'
        },
        healingTraits: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.HealingTraits.Label',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.HealingTraits.Hint'
        },
        useActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.UseActivity.Label',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.UseActivity.Hint'
        },
        range: {
            default: '0',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.Range.Hint'
        },
        alliesOnly: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReduceDamageTaken.AlliesOnly.Label',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.AlliesOnly.Hint'
        },
        othersOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.OthersOnly.Label',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.OthersOnly.Hint'
        }
    }
};
