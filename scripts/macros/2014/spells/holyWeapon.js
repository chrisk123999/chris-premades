import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (workflow.targets.size !== 1) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let targetToken = workflow.targets.first();
    let weapons = targetToken.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    let selectedWeapon;
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.HolyWeapon.NoWeapons', 'warn');
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    if (weapons.length === 1) {
        selectedWeapon = weapons[0];
    } else {
        selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.HolyWeapon.SelectWeapon', weapons);
        if (!selectedWeapon) return;
    }
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    let weaponEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'name',
                mode: 5,
                value: '{} (' + workflow.item.name + ')',
                priority: 20
            },
            {
                key: 'system.properties',
                mode: 2,
                value: 'mgc',
                priority: 20
            },
            {
                key: 'system.damage.parts',
                mode: 2,
                value: JSON.stringify([[formula, damageType]]),
                priority: 20
            }
        ]
    };
    let targetEffectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.HolyWeapon.Target'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: weaponEffectData.duration,
        changes: [
            {
                key: 'ATL.light.bright',
                mode: 4,
                value: genericUtils.handleMetric(30),
                priority: 20
            },
            {
                key: 'ATL.light.dim',
                mode: 4,
                value: genericUtils.handleMetric(60),
                priority: 20
            }
        ]
    };
    let casterEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: weaponEffectData.duration,
        flags: {
            'chris-premades': {
                holyWeapon: {
                    target: targetToken.document.uuid
                }
            }
        }
    };
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'holyWeaponDismiss', {strict: true});
    if (!feature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let casterEffect = await effectUtils.createEffect(workflow.actor, casterEffectData, {
        concentrationItem: workflow.item, 
        strictlyInterdependent: true, 
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'holyWeapon', 
            activityIdentifier: 'holyWeaponDismiss'
        }], 
        identifier: 'holyWeapon',
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['holyWeaponDismiss'],
            favorite: true
        }
    });
    await itemUtils.enchantItem(selectedWeapon, weaponEffectData, {parentEntity: casterEffect, strictlyInterdependent: true, identifier: 'holyWeaponTarget'});
    await effectUtils.createEffect(targetToken.actor, targetEffectData, {parentEntity: casterEffect, strictlyInterdependent: true});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: casterEffectData.duration});
}
async function dismiss({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'holyWeapon');
    if (!effect) return;
    let targetToken = await fromUuid(effect.flags['chris-premades']?.holyWeapon?.target);
    if (!targetToken) return;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'holyWeaponBurst', {strict: true});
    if (!feature) return;
    let targetTokens = tokenUtils.findNearby(targetToken, feature.range?.value ?? 30, 'enemy');
    await workflowUtils.syntheticActivityRoll(feature, targetTokens);
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (concentrationEffect) await genericUtils.remove(concentrationEffect);
}
async function early({dialog}) {
    dialog.configure = false;
}
export let holyWeapon = {
    name: 'Holy Weapon',
    version: '1.2.28',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['holyWeapon']
            },
            {
                pass: 'rollFinished',
                macro: dismiss,
                priority: 50,
                activities: ['holyWeaponDismiss']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['holyWeaponDismiss']
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '2d8',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'radiant',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};