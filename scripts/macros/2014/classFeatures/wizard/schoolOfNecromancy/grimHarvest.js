import {activityUtils, actorUtils, combatUtils, workflowUtils} from '../../../../../utils.js';

async function late({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageList) return;
    if (!combatUtils.perTurnCheck(item, 'grimHarvest')) return;
    let doHealing = false;
    for (let i of workflow.damageList) {
        if (i.oldHP === 0 || i.newHP > 0) continue;
        let targetActor = await fromUuid(i.actorUuid);
        if (!targetActor) continue;
        if (['undead', 'construct'].includes(actorUtils.typeOrRace(targetActor))) continue;
        doHealing = true;
        break;
    }
    if (!doHealing) return;
    let spellLevel;
    let spellSchool;
    if (workflow.item.type === 'spell') {
        spellLevel = workflowUtils.getCastLevel(workflow);
        spellSchool = workflow.item.system.school;
    } else if (workflow.item.type === 'feat') {
        spellLevel = workflow.item.flags['chris-premades']?.castData?.castLevel;
        spellSchool = workflow.item.flags['chris-premades']?.castData?.school;
    }
    if (!spellLevel || !spellSchool?.length) return;
    let healingAmount = spellLevel * (spellSchool === 'nec' ? 3 : 2);
    let feature = activityUtils.getActivityByIdentifier(item, 'grimHarvest', {strict: true});
    if (!feature) return;
    let activityData = activityUtils.withChangedDamage(feature, healingAmount);
    await workflowUtils.syntheticActivityDataRoll(activityData, item, item.actor, [workflow.token]);
    await combatUtils.setTurnCheck(item, 'grimHarvest');
}
async function combatEnd({trigger: {entity: item}}) {
    await combatUtils.setTurnCheck(item, 'grimHarvest', true);
}
export let grimHarvest = {
    name: 'Grim Harvest',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ]
};