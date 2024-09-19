import {compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, workflowUtils} from '../../../utils.js';

async function late({workflow}) {
    if (!workflow.item.system.uses.value) return;
    if (workflow.hitTargets.size !== 1) return;
    let radiantDone = workflow.damageList[0].damageDetail[1].value;
    if (!radiantDone) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Crystal Blade: Heal', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.CrystalBlade.Heal'});
    if (!featureData) return;
    let selection = await dialogUtils.confirm(workflow.item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: featureData.name}));
    if (!selection) return;
    await genericUtils.update(workflow.item, {'system.uses.value': workflow.item.system.uses.value - 1});
    featureData.system.damage.parts[0][0] = radiantDone + '[healing]';
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [workflow.token]);
}
async function useLight({workflow}) {
    let brightEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'crystalBladeBright');
    let dimEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'crystalBladeDim');
    let buttons = [];
    if (brightEffect) {
        buttons.push(
            ['CHRISPREMADES.Macros.CrystalBlade.Dim', 'dim'],
            ['CHRISPREMADES.Macros.CrystalBlade.Douse', 'douse']
        );
    } else if (dimEffect) {
        buttons.push(
            ['CHRISPREMADES.Macros.CrystalBlade.Bright', 'bright'],
            ['CHRISPREMADES.Macros.CrystalBlade.Douse', 'douse']
        );
    } else {
        buttons.push(
            ['CHRISPREMADES.Macros.CrystalBlade.Bright', 'bright'],
            ['CHRISPREMADES.Macros.CrystalBlade.Dim', 'dim']
        );
    }
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.WhatDo', buttons);
    if (!selection) return;
    if (selection === 'dim') {
        if (brightEffect) await genericUtils.remove(brightEffect);
        let effectData = {
            name: workflow.item.name + ' (' + genericUtils.translate('CHRISPREMADES.Light.Dim') + ')',
            img: workflow.item.img,
            origin: workflow.item.uuid,
            changes: [
                {
                    key: 'ATL.light.dim',
                    mode: 4,
                    value: 10,
                    priority: 20
                }
            ]
        };
        await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'crystalBladeDim', vae: [{type: 'use', name: workflow.item.name, identifier: 'crystalBladeLight'}]});
        return;
    } else if (selection === 'bright') {
        if (dimEffect) await genericUtils.remove(dimEffect);
        let effectData = {
            name: workflow.item.name + ' (' + genericUtils.translate('CHRISPREMADES.Light.Bright') + ')',
            img: workflow.item.img,
            origin: workflow.item.uuid,
            changes: [
                {
                    key: 'ATL.light.bright',
                    mode: 4,
                    value: 30,
                    priority: 20
                },
                {
                    key: 'ATL.light.dim',
                    mode: 4,
                    value: 60,
                    priority: 20
                }
            ]
        };
        await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'crystalBladeBright', vae: [{type: 'use', name: workflow.item.name, identifier: 'crystalBladeLight'}]});
        return;
    } else {
        if (brightEffect) await genericUtils.remove(brightEffect);
        if (dimEffect) await genericUtils.remove(dimEffect);
    }
}
export let crystalBlade = {
    name: 'Crystal Blade',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    equipment: {
        crystalBladeLight: {
            name: 'Crystal Blade: Light',
            compendium: 'itemEquipment',
            useJournal: true,
            translate: 'CHRISPREMADES.Macros.CrystalBlade.Light',
        }
    }
};
export let crystalBladeLight = {
    name: 'Cristal Blade Light',
    version: crystalBlade.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useLight,
                priority: 50
            }
        ]
    }
};
let version = '0.12.70';
export let crystalBladeGreatsword = {
    name: 'Crystal Greatsword',
    version
};
export let crystalBladeLongsword = {
    name: 'Crystal Longsword',
    version
};
export let crystalBladeRapier = {
    name: 'Crystal Rapier',
    version
};
export let crystalBladeScimitar = {
    name: 'Crystal Scimitar',
    version
};
export let crystalBladeShortsword = {
    name: 'Crystal Shortsword',
    version
};