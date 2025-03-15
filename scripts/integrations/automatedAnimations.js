import {genericUtils, itemUtils} from '../utils.js';

let keys = [
    'aaAutorec-melee',
    'aaAutorec-range',
    'aaAutorec-ontoken',
    'aaAutorec-templatefx',
    'aaAutorec-aura',
    'aaAutorec-preset',
    'aaAutorec-aefx'
];
function getAutoRec(name) {
    return keys.map(i => {
        return game.settings.get('autoanimations', i).find(j => {
            return j.label.toLowerCase().includes(name.toLowerCase());
        });
    }).find(k => k);
}
function renderItemSheet(app, [elem], options) {
    let isTidy = app?.classList?.contains?.('tidy5e-sheet');
    let headerButton;
    if (isTidy) {
        headerButton = app.element.querySelector('menu.controls-dropdown i.fa-biohazard');
        if (!headerButton) headerButton = elem.closest('.window-header')?.querySelector('.header-control.fa-biohazard');
    } else {
        headerButton = elem.closest('.window-app').querySelector('a.header-button.aaItemSettings');
    }
    if (!headerButton) return;
    let object = app.object;
    if (!object) return;
    let autoRec = getAutoRec(app.object.name);
    let isEnabled = object.flags?.autoanimations?.isEnabled ?? true;
    let isCustomized = object.flags?.autoanimations?.isCustomized ?? false;
    let color;
    if (!isEnabled && !autoRec && !isCustomized) {
        color = 'red';
    } else if (isEnabled && isCustomized && !autoRec) {
        color = 'green';
    } else if (isEnabled && isCustomized && autoRec) {
        color = 'dodgerblue';
    } else if (isEnabled && !isCustomized && autoRec) {
        color = 'orchid';
    } else if (!isEnabled && autoRec) {
        color = 'yellow';
    } else if (isEnabled && !autoRec) {
        color = 'orange';
    } else return;
    headerButton.style.color = color;
}
export let automatedAnimations = {
    renderItemSheet
};