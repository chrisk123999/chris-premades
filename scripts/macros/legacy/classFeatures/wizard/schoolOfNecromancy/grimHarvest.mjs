import {activityUtils, actorUtils, automationUtils, combatUtils, constants, documentUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function late({document: item, workflow, token}) {
    if (!workflow.hitTargets.size || !workflow.damageList) return;
    const combatData = tokenUtils.getCombatData(token);
    const stamps = genericUtils.getProperty(item, 'flags.cat.grimHarvest.stamps') ?? [];
    if (combatUtils.isStampedThisTurn(stamps, token.id, combatData)) return;
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
    if (!feature) return;
    const activityData = activityUtils.getDamageModifiedActivityData(feature, healingAmount);
    await workflowUtils.syntheticActivityDataRoll(activityData, item, [token]);
    await documentUtils.update(item, {'flags.cat.grimHarvest.stamps': combatUtils.addTurnStamp(stamps, token.id, combatData)});
}
export const grimHarvest = {
    name: 'Grim Harvest',
    version: '2.0.0',
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
