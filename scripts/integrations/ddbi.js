import * as macros from '../macros.js';
import {genericUtils} from '../utils.js';
async function ready() {
    let config = {
        removeChoices: [],
        renamedItems: {},
        additionalItems: {},
        removedItems: {},
        restrictedItems: {},
        correctedItems: {}
    };
    Object.values(macros).forEach(i => {
        let ddbi = i.ddbi;
        if (!ddbi) return;
        if (ddbi.removeChoices) config.removeChoices.push(...ddbi.removeChoices);
        if (ddbi.renamedItems) Object.entries(ddbi.renamedItems).forEach(j => config.renamedItems[j[0]] = j[1]);
        if (ddbi.additionalItems) Object.entries(ddbi.additionalItems).forEach(k => config.additionalItems[k[0]] = k[1]);
        if (ddbi.removedItems) Object.entries(ddbi.removedItems).forEach(l => config.removedItems[l[0]] = l[1]);
        if (ddbi.restrictedItems) Object.entries(ddbi.restrictedItems).forEach(m => config.restrictedItems[m[0]] = m[1]);
        if (ddbi.correctedItems) Object.entries(ddbi.correctedItems).forEach(n => config.correctedItems[n[0]] = n[1]);
    });
    genericUtils.setProperty(CONFIG, 'chrisPremades', config);
}
export let ddbi = {
    ready
};