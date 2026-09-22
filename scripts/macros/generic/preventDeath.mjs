import {activityUtils, automationUtils, constants, dialogUtils, queryUtils, workflowUtils} from '../../proxy.mjs';
async function damage({document, ditem, actor, targetToken, workflow}) {
    if (!document.system.uses.value || !ditem.isHit) return;
    const resultingHP = ditem.oldHP + (ditem.oldTempHP ?? 0) - ditem.totalDamage;
    if (resultingHP > 0) return;
    const maxHP = actor.system.attributes.hp.max;
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'preventDeath', Object.keys(preventDeath.genericConfig));
    if (config.killedOutright && resultingHP <= -maxHP) return;
    if (config.deathOnly && resultingHP > -maxHP) return;
    if (config.excludeCritical && workflow.isCritical) return;
    if (config.excludeDamageTypes.length && workflowUtils.getDamageTypes(workflow.damageRolls).intersects(new Set(config.excludeDamageTypes))) return;
    const selection = await dialogUtils.confirmUseItem(document, {userId: queryUtils.firstOwner(document.actor, true)});
    if (!selection) return;
    const saveActivity = document.system.activities.get(config.saveActivity);
    if (saveActivity) {
        const activityData = config.dcFromDamage
            ? activityUtils.getSaveDCModifiedActivityData(saveActivity, (saveActivity.save.dc.value ?? 0) + ditem.totalDamage)
            : saveActivity.toObject();
        const saveWorkflow = await workflowUtils.syntheticActivityDataRoll(activityData, document, [targetToken]);
        if (saveWorkflow?.failedSaves.size) return;
    }
    await workflowUtils.preventZeroHP(ditem, {killedOutright: config.killedOutright, deathOnly: config.deathOnly, actor});
    if (config.display && !saveActivity) await workflowUtils.completeItemUse(document, [targetToken]);
}
export const preventDeath = {
    rules: 'all',
    version: '2.0.3',
    category: 'mechanics',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: damage,
            priority: 150
        }
    ],
    genericConfig: {
        killedOutright: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.InstantDeath'
        },
        deathOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.DeathOnly'
        },
        saveActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.SaveActivity',
            hint: 'CHRISPREMADES.Macros.Generic.PreventDeath.SaveActivityHint'
        },
        dcFromDamage: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.DCFromDamage'
        },
        excludeCritical: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.ExcludeCritical'
        },
        excludeDamageTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PreventDeath.ExcludeDamageTypes',
            get options() { return constants.damageTypeOptions(); }
        },
        display: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Display'
        }
    }
};
