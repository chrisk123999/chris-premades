import {chris} from './helperFunctions.js';
let ids = [
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