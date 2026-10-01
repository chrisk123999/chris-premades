import {automationUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../proxy.mjs';
async function rest({document: activity}) {
    if (!automationUtils.getConfigValue(activity.item, 'auto')) return;
    await workflowUtils.syntheticActivityRoll(activity);
}
async function use({document: activity}) {
    const config = automationUtils.getConfigValues(activity.item, Object.keys(dedicatedWeapon.config));
    const tags = {};
    const items = activity.actor.itemTypes.weapon.filter(w => {
        if (config.proficiency && w.system.prof.multiplier <= 0) return;
        if (config.type?.length && !config.type.includes(w.system.type.value)) return;
        if (config.properties?.length && config.properties.some(p => w.system.properties.has(p))) return;
        if (w.flags['chris-premades']?.dedicatedWeapon)
            tags[w.id] = _loc('CHRISPREMADES.Macros.Legacy.DedicatedWeapon.Current');
        return true;
    });
    if (!items.length) return genericUtils.notify('CHRISPREMADES.Macros.Legacy.DedicatedWeapon.NoValid');
    const choice = await dialogUtils.selectDocumentDialog(activity.item.name, '', items, {displayTooltips: true, addNoneDocument: true, tags});
    if (!choice) return;
    const enchantData = activity.item.effects.contents[0]?.toObject();
    if (!enchantData) return;
    const parentEffect = (await effectUtils.createEffects(activity.actor, [{
        name: activity.item.name,
        descripiton: choice.name,
        img: activity.item.img,
        origin: activity.item.uuid,
        flags: {dae: { stackable: 'noneName'}}
    }]))?.[0];
    if (!parentEffect) return;
    genericUtils.setProperty(enchantData, 'flags.dnd5e.dependentOn', parentEffect.uuid);
    await itemUtils.enchantItem(choice, enchantData);
}
export const dedicatedWeapon = {
    name: 'Dedicated Weapon',
    version: '2.0.4',
    rules: '2014',
    rest: [
        {
            pass: 'actorShort',
            macro: rest,
            priority: 200
        }
    ],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        auto: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.DedicatedWeapon.Auto'
        },
        proficiency: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.DedicatedWeapon.Proficiency'
        },
        properties: {
            default: ['hvy', 'spc'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ExcludeWeaponProperties',
            get options() { return constants.itemProperties(); }
        },
        type: {
            default: ['simpleM', 'simpleR', 'martialM', 'martialR'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.WeaponTypes',
            get options() { return constants.weaponTypes(); }
        }
    }
};
