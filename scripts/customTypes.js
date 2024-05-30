import {genericUtils} from './utilities/genericUtils.js';
export function registerCustomTypes() {
    genericUtils.setProperty(CONFIG.DND5E.featureTypes, 'spellFeature', {
        'label': genericUtils.translate('CHRISPREMADES.customTypes.spellFeature')
    });
}