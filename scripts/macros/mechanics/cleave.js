import {compendiumUtils, constants, dialogUtils, genericUtils, tokenUtils, workflowUtils} from '../../utils.js';
export async function cleave(workflow) {
    if (!workflow.token || workflow.hitTargets.size != 1 || workflow.activity?.actionType != 'mwak' || !workflow.damageList || !workflow.item) return;
    let newHP = workflow.damageList[0].newHP;
    if (newHP != 0) return;
    if (workflow.targets.first().actor.items.getName('Minion')) return;
    let oldHP = workflow.damageList[0].oldHP;
    let leftoverDamage = workflow.damageList[0].totalDamage - (oldHP - newHP);
    if (!leftoverDamage) return;
    let cleaveSetting = genericUtils.getCPRSetting('cleave');
    if (cleaveSetting === 2) {
        let targetMaxHP = workflow.targets.first().actor.system.attributes.hp.max;
        if (oldHP != targetMaxHP) return;
    }
    let nearbyTargets = tokenUtils.findNearby(workflow.token, workflow.rangeDetails.range ?? 5, 'enemy');
    if (!nearbyTargets.length) return;
    let selection = await dialogUtils.selectTargetDialog('CHRISPREMADES.Settings.cleave.Name', 'CHRISPREMADES.Cleave.Use', nearbyTargets, {skipDeadAndUnconscious: false, buttons: 'yesNo'});
    if (!selection?.length) return;
    selection = selection[0];
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.miscellaneousItems, 'DMG Cleave', {object: true, getDescription: true});
    let attackId = Object.keys(featureData.system.activities)[0];
    featureData.system.activities[attackId].damage.parts[0].bonus = leftoverDamage;
    featureData.system.activities[attackId].damage.parts[0].types = [workflow.defaultDamageType];
    if (workflow.item.system.properties.has('mgc')) featureData.system.properties.push('mgc');
    genericUtils.setProperty(featureData, 'flags.chris-premades.setAttackRoll.formula', workflow.attackRoll.total);
    genericUtils.setProperty(featureData, 'flags.chris-premades.setDamageRoll.formula', leftoverDamage);
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [selection]);
}