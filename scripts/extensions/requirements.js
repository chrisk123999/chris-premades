import {custom} from '../events/custom.js';
import {genericUtils, itemUtils, socketUtils} from '../utils.js';
async function versionCheck(workflow) {
    if (!workflow.item) return;
    let isUpToDate = await itemUtils.isUpToDate(workflow.item);
    if (isUpToDate) return;
    let message = '<hr>@UUID[' + workflow.item.uuid + ']{' + workflow.item.name + '} ' + genericUtils.translate('CHRISPREMADES.Error.OutOfDateItem') + '<p><button class="chris-update-item">' + genericUtils.translate('CHRISPREMADES.Error.UpdateItem') + '</button></p>';
    await ChatMessage.create({
        speaker: {alias: genericUtils.translate('CHRISPREMADES.Generic.CPR')},
        content: message,
        whisper: [socketUtils.gmID()],
        flags: {
            'chris-premades': {
                button: {
                    type: 'updateItem',
                    data: {
                        itemUuid: workflow.item.uuid
                    }
                }
            }
        }
    });
    genericUtils.notify('CHRISPREMADES.Error.OutOfDateItem', 'warn');
    return true;
}
async function automationCheck(workflow) {
    if (!workflow.item) return;
    let identifier = genericUtils.getIdentifier(workflow.item);
    if (!identifier) return;
    let macro = custom.getMacro(identifier);
    if (!macro) return;
    if (!macro.requirements) return;
    let requiredSettings = [];
    if (macro.requirements.settings) {
        requiredSettings = macro.requirements.settings.map(i => genericUtils.getCPRSetting(i) ? false : i).filter(j => j);
    }
    let requiredCompendiums = [];
    if (macro.requirements.compendium) {
        requiredCompendiums = macro.requirements.compendium.map(i => {
            let key = genericUtils.getCPRSetting(i);
            if (!key) return i;
            let pack = game.packs.get(key);
            if (!pack) return i;
        }).filter(j => j);
    }
    if (!requiredSettings.length && !requiredCompendiums.length) return;
    let message = '';
    if (requiredSettings.length) message += '<hr>' + genericUtils.translate('CHRISPREMADES.Error.EnableSetting') + '<br>';
    requiredSettings.forEach(i => {
        let settingName = genericUtils.translate('CHRISPREMADES.Settings.' + i + '.Name');
        message += settingName + '<br>';
    });
    if (requiredCompendiums.length) message += '<hr>' + genericUtils.translate('CHRISPREMADES.Error.ConfigureCompendium') + '<br>';
    requiredCompendiums.forEach(i => {
        let compendiumName = genericUtils.translate('CHRISPREMADES.Settings.' + i + '.Name');
        message += compendiumName + '<br>';
    });
    await ChatMessage.create({
        speaker: {alias: genericUtils.translate('CHRISPREMADES.Generic.CPR')},
        content: message
    });
    return true;
}
async function ruleCheck(workflow) {
    if (!workflow.item) return;
    let identifier = genericUtils.getIdentifier(workflow.item);
    if (!identifier) return;
    let macro = custom.getMacro(identifier);
    if (!macro) return;
    if (!macro.rules) return;
    if (genericUtils.getRules(workflow.item) === macro.rules) return;
    let message = '<hr>' + genericUtils.translate('CHRISPREMADES.Error.RulesMismatch');
    await ChatMessage.create({
        speaker: {alias: genericUtils.translate('CHRISPREMADES.Generic.CPR')},
        content: message
    });
    return true;
}
async function scaleCheck(item) {
    let macro = custom.getMacro(genericUtils.getIdentifier(item), genericUtils.getRules(item));
    if (!macro) return;
    let scales = macro.scales;
    if (!scales) return;
    let missingClass = false;
    await Promise.all(scales.map(async data => {
        let classIdentifier = itemUtils.getConfig(item, data.classIdentifier);
        let classItem = item.actor.classes[classIdentifier] ?? item.actor.subclasses[classIdentifier];
        if (!classItem) {
            missingClass = true;
            let message = genericUtils.format('CHRISPREMADES.Requirements.MissingClass', {classIdentifier});
            genericUtils.notify(message, 'warn');
            return;
        }
        let scaleIdentifier = itemUtils.getConfig(item, data.scaleIdentifier);
        let scale = item.actor.system.scale[classIdentifier]?.[scaleIdentifier];
        if (scale?.parent?.configuration?.type === data.data.configuration.type) return;
        let classData = genericUtils.duplicate(classItem.toObject());
        if (scale?.type != data.data.type) classData.system.advancement = classData.system.advancement.filter(i => i.configuration?.identifier != scaleIdentifier);
        classData.system.advancement.push(data.data);
        await genericUtils.update(classItem, {'system.advancement': classData.system.advancement});
        let message = genericUtils.format('CHRISPREMADES.Requirements.ScaleAdded', {classIdentifier, scaleIdentifier});
        genericUtils.notify(message, 'info');
    }));
    if (missingClass) return true;
}
export let requirements = {
    versionCheck,
    automationCheck,
    ruleCheck,
    scaleCheck
};