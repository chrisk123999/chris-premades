import {automationUtils, documentUtils, rollUtils} from '../../../../../proxy.mjs';
function getValue(item, key) {
    return rollUtils.rollDiceSync(automationUtils.getConfigValue(item, key) || circleForms.config[key].default, {document: item}).total;
}
function options({document: item, data}) {
    data.options.cr = Math.max(data.options.cr, getValue(item, 'cr'));
}
async function transformed({document: item, data}) {
    if (data.rules !== '2024') return;
    const difference = getValue(item, 'ac') - (data.newActor.system.attributes.ac.value ?? 0);
    if (difference > 0) data.effectData.system.changes.push({key: 'system.attributes.ac.bonus', type: 'add', value: String(difference), priority: 20});
    const temp = getValue(item, 'tempHP');
    if ((data.newActor.system.attributes.hp.temp ?? 0) < temp) await documentUtils.update(data.newActor, {'system.attributes.hp.temp': temp});
}
export const circleForms = {
    name: 'Circle Forms',
    version: '2.1.11',
    rules: 'all',
    called: [
        {
            pass: 'actorWildShapeOptions',
            macro: options,
            priority: 50
        },
        {
            pass: 'actorWildShape',
            macro: transformed,
            priority: 50
        }
    ],
    config: {
        cr: {
            default: 'max(1, floor(@classes.druid.levels / 3))',
            type: 'formula',
            label: 'CHRISPREMADES.Macros.All.CircleForms.CR',
            category: 'homebrew'
        },
        ac: {
            default: '13 + @abilities.wis.mod',
            type: 'formula',
            label: 'CHRISPREMADES.Macros.All.CircleForms.AC',
            category: 'homebrew'
        },
        tempHP: {
            default: '@classes.druid.levels * 3',
            type: 'formula',
            label: 'CHRISPREMADES.Macros.All.CircleForms.TempHP',
            category: 'homebrew'
        }
    }
};
