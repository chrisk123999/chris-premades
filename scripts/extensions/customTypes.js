import {constants, genericUtils} from '../utils.js';
function init() {
    genericUtils.setProperty(CONFIG.DND5E.featureTypes, 'spellFeature', {
        label: genericUtils.translate('CHRISPREMADES.CustomTypes.SpellFeature')
    });
    if (genericUtils.getCPRSetting('bg3WeaponActionsEnabled')) weaponAction(true);
}
async function firearm(enabled) {
    if (enabled) {
        let pack = game.packs.get(constants.featurePacks.miscellaneousItems);
        if (!pack) return;
        let index = await pack.getIndex();
        let item = index.getName('Firearm');
        if (!item) return;
        CONFIG.DND5E.weaponIds.firearm = pack.metadata.packageName + '.' + pack.metadata.name + '.' + item._id;
        CONFIG.DND5E.featureTypes.class.subtypes.trickShot = genericUtils.translate('CHRISPREMADES.Firearm.TrickShot');
        CONFIG.DND5E.weaponProficiencies.oth = genericUtils.translate('CHRISPREMADES.Firearm.Other');
        CONFIG.DND5E.weaponProficienciesMap.firearm = 'oth';
        CONFIG.DND5E.weaponTypes.firearm = genericUtils.translate('CHRISPREMADES.Firearm.Firearm');
        CONFIG.DND5E.consumableTypes.ammo.subtypes['firearmAmmo'] = genericUtils.translate('CHRISPREMADES.Firearm.Ammunition');
    } else {
        delete CONFIG.DND5E.weaponIds.firearm;
        delete CONFIG.DND5E.featureTypes.class.subtypes.trickShot;
        delete CONFIG.DND5E.weaponProficiencies.oth;
        delete CONFIG.DND5E.weaponProficienciesMap.firearm;
        delete CONFIG.DND5E.weaponTypes.firearm;
        delete CONFIG.DND5E.consumableTypes.ammo.subtypes.firearmAmmo;
    }
}
async function weaponAction(enabled) {
    if (enabled) {
        genericUtils.setProperty(CONFIG.DND5E.featureTypes, 'weaponAction', {
            label: genericUtils.translate('CHRISPREMADES.BG3.WeaponAction')
        });
    } else {
        delete CONFIG.DND5E.featureTypes.weaponAction;
    }
}
export let customTypes = {
    init,
    firearm,
    weaponAction
};