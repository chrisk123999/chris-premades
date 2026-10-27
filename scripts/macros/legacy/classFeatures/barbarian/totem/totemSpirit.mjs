import {automationUtils, constants, genericUtils} from '../../../../../proxy.mjs';
async function bear({data, document: item}) {
    const resistances = automationUtils.getConfigValue(item, 'resistances');
    for (const value of resistances) data.effectData.changes.push({
        key: 'system.traits.dr.value', type: 'add', value
    });
}
async function eagle({data}) {
    data.effectData.changes.push({key: 'flags.gambits-premades.oaDisadvantage', type: 'override', value: true});
}
async function tiger({data, document: item, macroClass: {source}}) {
    const config = automationUtils.getConfigValues(item, Object.keys(tigerTotem.config));
    genericUtils.setProperty(data.effectData, `flags.${source}.tiger`, config);
    const macro = {source, rules: meta.rules, identifier: 'tigerJump'};
    if (data.effectData.flags.cat?.macros?.called)
        data.effectData.flags.cat.macros.called.push(macro);
    else 
        genericUtils.setProperty(data.effectData, 'flags.cat.macros.called', [macro]);
}
async function jump({document: effect, data, macroClass: {source}}) {
    switch(data.jumpType) {
        case 'long-jump':
            data.formula += ` + ${effect.flags[source]?.tiger?.long ?? 0}`;
            break;
        case 'standing-high-jump':
        case 'running-high-jump':
            data.formula += ` + ${effect.flags[source]?.tiger?.high ?? 0}`;
            break;
    }
}

const meta = {version: '2.1.4', rules: '2014'};
const macro = (name, fn, config) => ({
    name: 'Totem Spirit: ' + name,
    ...meta,
    called: [{pass: 'actorPreCreateRageEffect', macro: fn, priority: 250}],
    config
});
export const bearTotem = macro('Bear', bear, {
    resistances: {
        default: ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'radiant', 'slashing', 'thunder'],
        type: 'select-many',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Legacy.InfuseItem.Resistance',
        get options() { return constants.damageTypeOptions; }
    }
});
export const eagleTotem = macro('Eagle', eagle);
export const tigerTotem = macro('Tiger', tiger, {
    long: {
        default: 10,
        type: 'number',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Legacy.TotemSpiritTiger.Long'
    },
    high: {
        default: 3,
        type: 'number',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Legacy.TotemSpiritTiger.High'
    }
});
export const tigerJump = {...meta, called: [{pass: 'actorJump', macro: jump, priority: 300}]};
