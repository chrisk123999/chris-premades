import {activityUtils, actorUtils, automationUtils, constants, documentUtils, itemUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function late({document: item, workflow, token}) {
    if (!workflow.hitTargets.count || !workflow.damageList) return;
    const combatData = tokenUtils.getCombatData(token);
    if (item.system.hasLimitedUses && !item.system.uses.value) return;
    const excludedCreatureTypes = automationUtils.getConfigValue(item, 'excludedCreatureTypes') ?? [];
    let doHealing = false;
    for (const i of workflow.damageList) {
        if (i.oldHP === 0 || i.newHP > 0) continue;
        const targetActor = await fromUuid(i.actorUuid);
        if (!targetActor) continue;
        if (excludedCreatureTypes.includes(actorUtils.typeOrRace(targetActor))) continue;
        doHealing = true;
        break;
    }
    if (!doHealing) return;
    const spellLevel = workflowUtils.getCastLevel(workflow);
    const spellSchool = workflow.item.type === 'spell' ? workflow.item.system.school : itemUtils.getSavedCastData(workflow.item).school;
    if (spellLevel < 1 || !spellSchool?.length) return;
    const healingMultiplier = automationUtils.getConfigValue(item, 'healingMultiplier') ?? 2;
    const necromancyMultiplier = automationUtils.getConfigValue(item, 'necromancyMultiplier') ?? 3;
    const healingAmount = spellLevel * (spellSchool === 'nec' ? necromancyMultiplier : healingMultiplier);
    const feature = itemUtils.getActivityByIdentifier(item, 'grimHarvest');
    if (!feature) return Logging.addMacroWarning('chris-premades', 'grim-harvest', 'Grim Harvest healing activity missing.', {notify: 'warn'});
    const activityData = activityUtils.getDamageModifiedActivityData(feature, healingAmount);
    await workflowUtils.syntheticActivityDataRoll(activityData, item, [token]);
    if (item.system.hasLimitedUses && combatData.inCombat) await documentUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
}
export const grimHarvest = {
    name: 'Grim Harvest',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: late,
            priority: 50
        }
    ],
    config: {
        excludedCreatureTypes: {
            default: ['undead', 'construct'],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.Legacy.GrimHarvest.ExcludedCreatureTypes',
            category: 'targeting',
            get options() { return constants.creatureTypeOptions; }
        },
        healingMultiplier: {
            default: 2,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.GrimHarvest.HealingMultiplier',
            category: 'homebrew'
        },
        necromancyMultiplier: {
            default: 3,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.GrimHarvest.NecromancyMultiplier',
            category: 'homebrew'
        }
    }
};
