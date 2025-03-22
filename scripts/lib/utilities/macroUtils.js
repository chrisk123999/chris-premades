import {custom} from '../../events/custom.js';
import {genericUtils} from './genericUtils.js';
function getEmbeddedMacros(entity, type, {pass}) {
    let flagData;
    if (entity.documentName === 'Activity') {
        flagData = genericUtils.getProperty(entity.item, 'flags.chris-premades.embeddedActivityMacros.' + entity.id + '.' + type);
    } else {
        flagData = genericUtils.getProperty(entity, 'flags.chris-premades.embeddedMacros.' + type);
    }
    if (!flagData) return [];
    flagData = flagData.filter(i => {
        if (pass && i.pass !== pass) return false;
        return true;
    });
    return flagData;
}
async function addEmbeddedMacro(entity, type, macroData) {
    let flagData;
    if (entity.documentName === 'Activity') {
        flagData = genericUtils.getProperty(entity.item, 'flags.chris-premades.embeddedActivityMacros.' + entity.id + '.' + type) ?? [];
    } else {
        flagData = genericUtils.getProperty(entity, 'flags.chris-premades.embeddedMacros.' + type) ?? [];
    }
    flagData.push(macroData);
    if (entity.documentName === 'Activity') {
        await genericUtils.setFlag(entity.item, 'chris-premades', 'embeddedActivityMacros.' + entity.id + '.' + type, flagData);
    } else {
        await genericUtils.setFlag(entity, 'chris-premades', 'embeddedMacros.' + type, flagData);
    }
}
async function removeEmbeddedMacro(entity, type, name) {
    let flagData;
    if (entity.documentName === 'Activity') {
        flagData = genericUtils.getProperty(entity.item, 'flags.chris-premades.embeddedActivityMacros.' + entity.id + '.' + type) ?? [];
    } else {
        flagData = genericUtils.getProperty(entity, 'flags.chris-premades.embeddedMacros.' + type) ?? [];
    }
    flagData = flagData.filter(i => i.name !== name);
    if (entity.documentName === 'Activity') {
        await genericUtils.setFlag(entity.item, 'chris-premades', 'embeddedActivityMacros.' + entity.id + '.' + type, flagData);
    } else {
        await genericUtils.setFlag(entity, 'chris-premades', 'embeddedMacros.' + type, flagData);
    }
}
export let macroUtils = {
    registerMacros: custom.registerMacros,
    getMacro: custom.getMacro,
    getEmbeddedMacros,
    addEmbeddedMacro,
    removeEmbeddedMacro
};