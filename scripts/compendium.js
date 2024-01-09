import {constants} from './constants.js';
import {chris} from './helperFunctions.js';
const ids = [
    'chris-premades.CPR Spell Features',
    'chris-premades.CPR Class Feature Items',
    'chris-premades.CPR Monster Feature Items',
    'chris-premades.CPR Summon Features',
    'chris-premades.CPR Feat Features',
    'chris-premades.CPR Homebrew Feature Items',
    'chris-premades.CPR Race Feature Items',
    'chris-premades.CPR Item Features'
];
export async function compendiumRender(doc, html, context) {
    if (!ids.includes(doc.metadata.id)) return;
    await chris.dialog('Chris\'s Premades: Warning', [['OK', false]], 'This compendium is not intended to be accessed this way!<br>You do not need anything from here.');
}
export async function additionalCompendiums() {
    let packs = game.packs.filter(i => !i.metadata.id.includes('chris-premades.') && i.metadata.type === 'Item');
    let oldSettings = game.settings.get('chris-premades', 'Additional Compendiums');
    let inputs = packs.map(i => ({'label': i.metadata.label, 'type': 'checkbox', 'options': oldSettings.includes(i.metadata.id)}));
    let selection = await chris.menu('Additional Compendiums', constants.okCancel, inputs, true);
    if (!selection.buttons) return;
    let newPacks = [];
    for (let i = 0; selection.inputs.length > i; i++) {
        if (!selection.inputs[i]) continue;
        newPacks.push(packs[i].metadata.id);
    }
    await game.settings.set('chris-premades', 'Additional Compendiums', newPacks);
}
export async function additionalCompendiumPriority() {
    let packs = game.settings.get('chris-premades', 'Additional Compendiums');
    if (!packs.length) {
        ui.notifications.info('There are no compendiums selected in the "Additional Compendiums" setting!');
        return;
    }
    let oldSettings = game.settings.get('chris-premades', 'Additional Compendium Priority');
    let inputs = packs.map(i => ({'label': game.packs.get(i)?.metadata?.label ?? 'Unknown (' + i + ')', 'type': 'number', 'options': oldSettings[i] ?? 100}));
    inputs.unshift({'label': 'Chris\'s Premades', 'type': 'number', 'options': oldSettings['CPR'] ?? 0});
    let selection = await chris.menu('Additional Compendium Priority', constants.okCancel, inputs, true, 'Lower Number = Higher Priority');
    if (!selection.buttons) return;
    let newSettings = {};
    for (let i = 1; inputs.length > i; i++) {
        newSettings[packs[i - 1]] = isNaN(selection.inputs[i]) ? 100 : selection.inputs[i];
    }
    newSettings['CPR'] = selection.inputs[0];
    await game.settings.set('chris-premades', 'Additional Compendium Priority', newSettings);
}
export async function selectCompendium(setting) {
    let packs = game.packs.filter(i => !i.metadata.id.includes('chris-premades.') && i.metadata.type === 'Item');
    let inputs = packs.map(i => ({'label': i.metadata.label, 'type': 'radio'}));
    let selection = await chris.menu('Select a Compendium', constants.okCancel, inputs, true);
    if (!selection.buttons) return;
    let pack = packs[selection.inputs.findIndex(i => i)];
    if (!pack) return;
    await game.settings.set('chris-premades', setting, pack.metadata.id);
}