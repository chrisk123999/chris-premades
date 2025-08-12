import {genericUtils} from '../utils.js';

const daeFieldBrowserFields = [];

function initFlags() {
    let browserFields = [
        'flags.chris-premades.senses.magicalDarkness',
        'flags.chris-premades.turnImmunity',
        'flags.chris-premades.turnResistance'
    ];
    for (let condition of Object.keys(CONFIG.DND5E.conditionTypes)) {
        browserFields.push('flags.chris-premades.CR.' + condition);
        browserFields.push('flags.chris-premades.CV.' + condition);
    }
    daeFieldBrowserFields.push(...Array.from(new Set(browserFields)).sort());
}
function injectFlags() {
    for (let [condition, {name}] of Object.entries(CONFIG.DND5E.conditionTypes)) {
        foundry.utils.setProperty(game.i18n.translations, 'dae.CPR.fieldData.flags.chris-premades.CV.' + condition, {
            name: genericUtils.format('CHRISPREMADES.Generic.ConditionVulnerability.Name', {condition: name}),
            description: genericUtils.format('CHRISPREMADES.Generic.ConditionVulnerability.Description', {condition: name})
        });
        foundry.utils.setProperty(game.i18n.translations, 'dae.CPR.fieldData.flags.chris-premades.CR.' + condition, {
            name: genericUtils.format('CHRISPREMADES.Generic.ConditionResistance.Name', {condition: name}),
            description: genericUtils.format('CHRISPREMADES.Generic.ConditionResistance.Description', {condition: name})
        });
    }
    DAE.addAutoFields(['flags.chris-premades.senses.magicalDarkness']);
}
function addFlags(fieldData) {
    fieldData['CPR'] = daeFieldBrowserFields;
}
function modifySpecials(specKey, specials) {
    for (let field of daeFieldBrowserFields) {
        specials[field] = [new foundry.data.fields.StringField(), 5];
    }
    delete specials['flags.chris-premades.senses.magicalDarkness'];
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
    injectFlags,
    addFlags,
    modifySpecials,
    renderItemSheet,
    daeFieldBrowserFields
};