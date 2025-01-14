import {genericUtils} from '../utils.js';

const daeFieldBrowserFields = [];

function initFlags() {
    let browserFields = [
        'flags.chris-premades.senses.magicalDarkness',
        'flags.chris-premades.turnImmunity',
        'flags.chris-premades.turnResistance'
    ];
    for (let [condition, {label}] of Object.entries(CONFIG.DND5E.conditionTypes)) {
        browserFields.push('flags.chris-premades.CR.' + condition);
        browserFields.push('flags.chris-premades.CV.' + condition);
        foundry.utils.setProperty(game.i18n.translations, 'dae.CPR.fieldData.flags.chris-premades.CV.' + condition, {
            name: genericUtils.format('CHRISPREMADES.Generic.ConditionVulnerability.Name', {condition: label}),
            description: genericUtils.format('CHRISPREMADES.Generic.ConditionVulnerability.Description', {condition: label})
        });
        foundry.utils.setProperty(game.i18n.translations, 'dae.CPR.fieldData.flags.chris-premades.CR.' + condition, {
            name: genericUtils.format('CHRISPREMADES.Generic.ConditionResistance.Name', {condition: label}),
            description: genericUtils.format('CHRISPREMADES.Generic.ConditionResistance.Description', {condition: label})
        });
    }
    daeFieldBrowserFields.push(...Array.from(new Set(browserFields)).sort());
    DAE.addAutoFields(daeFieldBrowserFields);
}
function addFlags(fieldData) {
    fieldData['CPR'] = daeFieldBrowserFields;
}
function renderItemSheet(app, [elem], options) {
    let isTidy = app?.classList?.contains?.('tidy5e-sheet');
    let headerButton;
    if (isTidy) {
        headerButton = app.element.querySelector('menu.controls-dropdown i.fa-wrench');
        if (!headerButton) headerButton = elem.closest('.window-header')?.querySelector('.header-control.fa-wrench');
    } else {
        headerButton = elem.closest('.window-app').querySelector('.dae-config-itemsheet');
    }
    if (!headerButton) return;
    let object = app.object;
    if (!object) return;
    let passiveEffect = !!object.effects.find(i => i.transfer && !i.flags.dnd5e?.type != 'enchantment');
    let transferEffect = !!object.effects.find(i => !i.transfer && !i.flags.dnd5e?.type != 'enchantment');
    let enchantmentEffect = !!object.effects.find(i => i.flags.dnd5e?.type === 'enchantment');
    let color;
    if (passiveEffect && !transferEffect && !enchantmentEffect) {
        color = 'dodgerblue';
    } else if (transferEffect && !passiveEffect && !enchantmentEffect) {
        color = 'green';
    } else if (transferEffect && passiveEffect && !enchantmentEffect) {
        color = 'orchid';
    } else if (passiveEffect && !transferEffect && enchantmentEffect) {
        color = 'orange';
    } else if (!passiveEffect && !passiveEffect && enchantmentEffect) {
        color = 'pink';
    } else if (transferEffect && passiveEffect && enchantmentEffect) {
        color = 'brown';
    } else return;
    headerButton.style.color = color;
}
export let dae = {
    initFlags,
    addFlags,
    renderItemSheet,
    daeFieldBrowserFields
};