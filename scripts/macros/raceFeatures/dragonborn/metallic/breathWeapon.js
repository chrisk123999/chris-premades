import {compendiumUtils, constants, dialogUtils, errors, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let enervatingData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.raceFeatureItems, 'Enervating Breath', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.MetallicBreathWeapon.Enervating', flatDC: itemUtils.getSaveDC(workflow.item)});
    let repulsionData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.raceFeatureItems, 'Repulsion Breath', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.MetallicBreathWeapon.Repulsion', flatDC: itemUtils.getSaveDC(workflow.item)});
    if (!enervatingData || !repulsionData) {
        errors.missingPackItem();
        return;
    }
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.MetallicBreathWeapon.Select', [
        [enervatingData.name, 'enervating'],
        [repulsionData.name, 'repulsion']
    ]);
    if (!selection) return;
    if (selection === 'enervating') {
        await workflowUtils.syntheticItemDataRoll(enervatingData, workflow.actor, []);
    } else {
        await workflowUtils.syntheticItemDataRoll(repulsionData, workflow.actor, []);
    }
}
async function late({workflow}) {
    if (!workflow.failedSaves.size) return;
    await Promise.all(workflow.failedSaves.map(async i => await tokenUtils.pushToken(workflow.token, i, 20)));
}
export let metallicBreathWeapon = {
    name: 'Metallic Breath Weapon',
    version: '0.12.64',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let metallicBreathWeaponRepulsion = {
    name: 'Metallic Breath Weapon: Repulsion Breath',
    version: metallicBreathWeapon.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};
let version = '0.12.64';
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