import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

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
        genericUtils.notify('CHRISPREMADES.macros.holyWeapon.noWeapons', 'warn');
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    if (weapons.length === 1) {
        selectedWeapon = weapons[0];
    } else {
        selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.macros.holyWeapon.selectWeapon', weapons);
        if (!selectedWeapon) return;
    }
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    let weaponEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 3600 * workflow.item.system.duration.value
        },
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
                value: JSON.stringify([[formula + '[' + damageType + ']', damageType]]),
                priority: 20
            }
        ]
    };
    let targetEffectData = {
        name: genericUtils.translate('CHRISPREMADES.macros.holyWeapon.target'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 3600 * workflow.item.system.duration.value
        },
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
    let casterEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 3600 * workflow.item.system.duration.value
        },
        flags: {
            'chris-premades': {
                holyWeapon: {
                    target: targetToken.document.uuid
                }
            }
        }
    };
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Holy Weapon: Dismiss', {getDescription: true, translate: 'CHRISPREMADES.macros.holyWeapon.dismiss', object: true});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let casterEffect = await effectUtils.createEffect(workflow.actor, casterEffectData, {concentrationItem: workflow.item, strictlyInterdependent: true, vae: {button: featureData.name}, identifier: 'holyWeapon'});
    await itemUtils.enchantItem(selectedWeapon, weaponEffectData, {parentEntity: casterEffect, strictlyInterdependent: true, identifier: 'holyWeaponTarget'});
    await effectUtils.createEffect(targetToken.actor, targetEffectData, {parentEntity: casterEffect, strictlyInterdependent: true});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: casterEffect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures')});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': casterEffectData.duration.seconds});
}
async function dismiss({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'holyWeapon');
    if (!effect) return;
    let targetToken = await fromUuid(effect.flags['chris-premades']?.holyWeapon?.target);
    if (!targetToken) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let spellDC = itemUtils.getSaveDC(originItem);
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Holy Weapon: Burst', {getDescription: true, translate: 'CHRISPREMADES.macros.holyWeapon.burst', object: true});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.effects[0].changes[0].value = 'label=' + genericUtils.translate('CHRISPREMADES.macros.holyWeapon.burstOvertime') + ',turn=end,saveDC=' + spellDC + ',saveAbility=con,savingThrow=true,saveMagic=true,saveRemove=true';
    genericUtils.setProperty(featureData.effects[0], 'flags.chris-premades.conditions', ['blinded']);
    featureData.system.save.dc = spellDC;
    genericUtils.setProperty(featureData, 'flags.chris-premades.spell.castData', {castLevel: 5, school: originItem.system.school});
    let targetTokens = tokenUtils.findNearby(targetToken, featureData.system.target?.value ?? 30, 'enemy');
    await workflowUtils.syntheticItemDataRoll(featureData, targetToken.actor, targetTokens);
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, originItem);
    if (concentrationEffect) await genericUtils.remove(concentrationEffect);
}
export let holyWeapon = {
    name: 'Holy Weapon',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.config.formula',
            type: 'text',
            default: '2d8',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.config.damageType',
            type: 'select',
            default: 'radiant',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let holyWeaponDismiss = {
    name: 'Holy Weapon: Dismiss',
    version: holyWeapon.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: dismiss,
                priority: 50
            }
        ]
    }
};