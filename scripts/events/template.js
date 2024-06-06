import * as macros from '../macros.js';
function getTemplateMacroData(template) {
    return template.flags['chris-premades']?.macros?.template ?? [];
}
export function collectTemplateMacros(template) {
    let macroList = [];
    macroList.push(...getTemplateMacroData(template));
    if (!macroList.length) return [];
    return macroList.map(i => macros[i]).filter(j => j);
}