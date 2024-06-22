import {DialogApp} from './applications/dialog.js';
import {actorUtils, effectUtils, genericUtils, socketUtils} from './utils.js';
async function createActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (!(effect.parent instanceof Actor)) return;
    let effectConditions = effect.flags['chris-premades']?.conditions;
    if (!effectConditions) return;
    await effectUtils.applyConditions(effect.parent, effectConditions);
}
async function deleteActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (!(effect.parent instanceof Actor)) return;
    let effectConditions = effect.flags['chris-premades']?.conditions;
    if (!effectConditions) return;
    let ids = [];
    effectConditions.forEach(i => {
        let otherEffect = actorUtils.getEffects(effect.parent).find(j => j.id != effect.id && j.flags['chris-premades']?.conditions?.includes(i));
        if (otherEffect) return;
        let cEffect = effectUtils.getEffectByStatusID(effect.parent, i);
        if (cEffect) ids.push(cEffect.id);
    });
    if (ids.length) await effect.parent.deleteEmbeddedDocuments('ActiveEffect', ids);
}
function setStatusEffectIcons() {
    let icons = genericUtils.getCPRSetting('statusEffectIcons');
    CONFIG.statusEffects.forEach(i => {
        if (icons[i.id] && i.img != icons[i.id].img) i.img = icons[i.id];
    });
}
async function configureStatusEffectIcons() {
    let icons = genericUtils.getCPRSetting('statusEffectIcons');
    let inputs = CONFIG.statusEffects.map(i => ({
        label: i.name,
        name: i.id,
        options: {
            type: 'image',
            currentValue: icons[i.id] ?? CONFIG.statusEffects.find(j => j.id === i.id)?.img ?? ''
        }
    }));
    let selection = await DialogApp.dialog('CHRISPREMADES.configureStatusEffects.title', '', [['filePicker', inputs, {displayAsRows: true}]], 'okCancel', {width: 500, height: 800});
    if (!selection) return;
    await genericUtils.setCPRSetting('statusEffectIcons', selection);
}
function disableNonConditionStatusEffects() {
    let ids = [
        'bleeding',
        'burrowing',
        'cursed',
        'ethereal',
        'flying',
        'hovering',
        'marked',
        'sleeping',
        'transformed'
    ];
    CONFIG.statusEffects = CONFIG.statusEffects.filter(i => !ids.includes(i.id));
}
export let conditions = {
    createActiveEffect,
    deleteActiveEffect,
    setStatusEffectIcons,
    configureStatusEffectIcons,
    disableNonConditionStatusEffects
};