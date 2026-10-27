import {dataUtils, genericUtils, itemUtils} from './proxy.mjs';
function addEffectMacro(effectData, {type, macroIdentifier, rules, effectIdentifier}) {
    return dataUtils.buildEffectData(effectData, {
        macros: [
            {
                type,
                macros: [
                    {
                        source: 'chris-premades',
                        identifier: macroIdentifier,
                        rules,
                        effectIdentifier
                    }
                ]
            }
        ]
    });
}
async function createCharms(actor, itemDatas, {key, source, favorite} = {}) {
    const flaggedDatas = itemDatas.map(itemData => genericUtils.mergeObject(itemData, {flags: {'chris-premades': {[key]: {source: source.uuid}}}}, {inplace: false}));
    return itemUtils.createItems(actor, flaggedDatas, {favorite});
}
async function deleteCharms(source, key) {
    return itemUtils.deleteWorldItemsByFlag('chris-premades', key + '.source', source.uuid);
}
function carriesCharm(actor, source, keys) {
    return !!actor?.items.some(item => keys.some(key => item.flags['chris-premades']?.[key]?.source === source.uuid));
}
export default {
    addEffectMacro,
    createCharms,
    deleteCharms,
    carriesCharm
};
