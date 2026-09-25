import {dataUtils} from './proxy.mjs';
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
export default {
    addEffectMacro
};
