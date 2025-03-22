import {custom} from '../events/custom.js';
import {genericUtils, macroUtils} from '../utils.js';
function preCreateMeasuredTemplate(template, updates, options, userId) {
    let originActivityUuid = genericUtils.getProperty(template, 'flags.dnd5e.origin');
    if (!originActivityUuid) return;
    let activity = fromUuidSync(originActivityUuid, {strict: false});
    if (!activity) return;
    if (!template.flags['chris-premades']?.rules) {
        let rules = genericUtils.getRules(activity.item);
        let identifier = genericUtils.getIdentifier(activity.item);
        if (identifier) {
            let macro = custom.getMacro(identifier, rules);
            if (macro?.legacyTemplate) rules = 'legacy';
        }
        template.updateSource({'flags.chris-premades.rules': rules});
    }
    let embeddedActivityEntityMacros = macroUtils.getEmbeddedActivityShapeMacros(activity, 'template');
    if (embeddedActivityEntityMacros.length) {
        let flagData = {};
        let types = new Set(embeddedActivityEntityMacros.map(i => i.type));
        types.forEach(i => {
            genericUtils.setProperty(flagData, i, embeddedActivityEntityMacros.filter(j => j.type === i));
        });
        template.updateSource({'flags.chris-premades.embeddedMacros': flagData});
    }
}
export let template = {
    preCreateMeasuredTemplate
};