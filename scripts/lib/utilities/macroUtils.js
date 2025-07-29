import {eventStructure, getAllDocumentPasses, getDocumentPasses, getEventTypes} from '../../applications/embeddedMacros.js';
import {custom} from '../../events/custom.js';
import {genericUtils} from './genericUtils.js';
function getEmbeddedMacros(entity, type, {pass} = {}) {
    let flagData;
    type = type.replace('.', '-');
    if (entity.documentName === 'Activity') {
        flagData = genericUtils.getProperty(entity.item, 'flags.chris-premades.embeddedActivityMacros.' + entity.id);
    } else {
        flagData = genericUtils.getProperty(entity, 'flags.chris-premades.embeddedMacros');
    }
    if (!flagData) return [];
    flagData = flagData.filter(i => {
        if (i.type !== type) return false;
        if (pass && i.pass !== pass) return false;
        return true;
    });
    return flagData;
}
async function addEmbeddedMacro(entity, macroData) {
    let flagData;
    if (entity.documentName === 'Activity') {
        flagData = genericUtils.getProperty(entity.item, 'flags.chris-premades.embeddedActivityMacros.' + entity.id) ?? [];
    } else {
        flagData = genericUtils.getProperty(entity, 'flags.chris-premades.embeddedMacros') ?? [];
    }
    flagData.push(macroData);
    if (entity.documentName === 'Activity') {
        await genericUtils.setFlag(entity.item, 'chris-premades', 'embeddedActivityMacros.' + entity.id, flagData);
    } else {
        await genericUtils.setFlag(entity, 'chris-premades', 'embeddedMacros', flagData);
    }
}
async function removeEmbeddedMacro(entity, type, name) {
    let flagData;
    if (entity.documentName === 'Activity') {
        flagData = genericUtils.getProperty(entity.item, 'flags.chris-premades.embeddedActivityMacros.' + entity.id) ?? [];
    } else {
        flagData = genericUtils.getProperty(entity, 'flags.chris-premades.embeddedMacros') ?? [];
    }
    flagData = flagData.filter(i => (i.type !== type) || (i.name !== name));
    if (entity.documentName === 'Activity') {
        await genericUtils.setFlag(entity.item, 'chris-premades', 'embeddedActivityMacros.' + entity.id, flagData);
    } else {
        await genericUtils.setFlag(entity, 'chris-premades', 'embeddedMacros', flagData);
    }
}
function getEmbeddedActivityShapeMacros(activity, entityType) {
    return genericUtils.getProperty(activity.item, 'flags.chris-premades.embeddedActivityShapeMacros.' + activity.id + '.' + entityType) ?? [];
}
async function addEmbeddedActivityShapeMacro(activity, entityType, type, macroData) {
    let flagData = genericUtils.getProperty(activity.item, 'flags.chris-premades.embeddedActivityShapeMacros.' + activity.id + '.' + entityType) ?? [];
    macroData.type = type;
    flagData.push(macroData);
    await genericUtils.setFlag(activity.item, 'chris-premades', 'embeddedActivityShapeMacros.' + activity.id + '.' + entityType, flagData);
}
async function removeEmbeddedActivityShapeMacro(activity, entityType, name) {
    let flagData = genericUtils.getProperty(activity.item, 'flags.chris-premades.embeddedActivityShapeMacros.' + activity.id + '.' + entityType) ?? [];
    flagData = flagData.filter(i => i.name !== name);
    await genericUtils.setFlag(activity.item, 'chris-premades', 'embeddedActivityShapeMacros.' + activity.id + '.' + entityType, flagData);
}
function getAllEmbeddedMacros(entity) {
    let allMacros = {};
    Object.keys(eventStructure).forEach(i => genericUtils.setProperty(allMacros, i, getEmbeddedMacros(entity, i)));
    return allMacros;
}
export let macroUtils = {
    registerMacros: custom.registerMacros,
    getMacro: custom.getMacro,
    getEmbeddedMacros,
    addEmbeddedMacro,
    removeEmbeddedMacro,
    getEmbeddedActivityShapeMacros,
    addEmbeddedActivityShapeMacro,
    removeEmbeddedActivityShapeMacro,
    getDocumentPasses,
    getEventTypes,
    getAllDocumentPasses,
    getAllEmbeddedMacros
};