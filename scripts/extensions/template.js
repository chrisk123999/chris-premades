import {custom} from '../events/custom.js';
import {genericUtils} from '../utils.js';
function rules(template, updates, options, userId) {
    if (updates.flags['chris-premades']?.rules || !updates.flags.dnd5e?.item) return;
    let item = fromUuidSync(updates.flags.dnd5e.item);
    if (!item) return;
    let rules = genericUtils.getRules(item);
    let identifier = genericUtils.getIdentifier(item);
    if (identifier) {
        let macro = custom.getMacro(identifier, rules);
        if (macro?.legacyTemplate) rules = 'legacy';
    }
    template.updateSource({'flags.chris-premades.rules': rules});
}
export let template = {
    rules
};