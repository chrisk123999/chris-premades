import {activityUtils, dialogUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
import {proneOnFail} from '../../../generic/proneOnFail.js';
async function use({workflow}) {
    let enervatingFeature = activityUtils.getActivityByIdentifier(workflow.item, 'metallicBreathWeaponEnervating', {strict: true});
    let repulsionFeature = activityUtils.getActivityByIdentifier(workflow.item, 'metallicBreathWeaponRepulsion', {strict: true});
    if (!enervatingFeature || !repulsionFeature) return;
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.MetallicBreathWeapon.Select', [
        [enervatingFeature.name, 'enervating'],
        [repulsionFeature.name, 'repulsion']
    ]);
    if (!selection) return;
    if (selection === 'enervating') {
        await workflowUtils.syntheticActivityRoll(enervatingFeature, Array.from(workflow.targets));
    } else {
        await workflowUtils.syntheticActivityRoll(repulsionFeature, Array.from(workflow.targets));
    }
}
async function proneOnFailMacro({workflow}) {
    if (!workflow.failedSaves.size) return;
    await Promise.all(workflow.failedSaves.map(async i => {
        await tokenUtils.pushToken(workflow.token, i, 20);
    }));
    await proneOnFail.midi.item[0].macro({workflow});
}
export let metallicBreathWeapon = {
    name: 'Metallic Breath Weapon',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['metallicBreathWeapon']
            },
            {
                pass: 'rollFinished',
                macro: proneOnFailMacro,
                priority: 50,
                activities: ['metallicBreathWeaponRepulsion']
            }
        ]
    }
};
let version = '1.1.10';
export let breathWeaponAcid = {
    name: 'Breath Weapon (Force)',
    version
};
export let breathWeaponCold = {
    name: 'Breath Weapon (Cold)',
    version
};
export let breathWeaponFire = {
    name: 'Breath Weapon (Fire)',
    version
};
export let breathWeaponLightning = {
    name: 'Breath Weapon (Lightning)',
    version
};