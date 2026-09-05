import {automationUtils, dialogUtils, queryUtils, workflowUtils} from '../../proxy.mjs';
async function damage({document, ditem, actor, targetToken}) {
    if (!document.system.uses.value || !ditem.isHit) return;
    const resultingHP = ditem.oldHP + (ditem.oldTempHP ?? 0) - ditem.totalDamage;
    if (resultingHP > 0) return;
    const maxHP = actor.system.attributes.hp.max;
    const killedOutright = automationUtils.getGenericConfigValue(document, 'chris-premades', 'preventDeath', 'killedOutright');
    const deathOnly = automationUtils.getGenericConfigValue(document, 'chris-premades', 'preventDeath', 'deathOnly');
    if (killedOutright && resultingHP <= -maxHP) return;
    if (deathOnly && resultingHP > -maxHP) return;
    const selection = await dialogUtils.confirmUseItem(document, {userId: queryUtils.firstOwner(document.actor, true)});
    if (!selection) return;
    await workflowUtils.preventZeroHP(ditem, {killedOutright, deathOnly, actor});
    const display = automationUtils.getGenericConfigValue(document, 'chris-premades', 'preventDeath', 'display');
    if (!display) return;
    await workflowUtils.completeItemUse(document, [targetToken]);
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
        display: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Display'
        }
    }
};