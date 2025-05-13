import {activityUtils, actorUtils, compendiumUtils, dialogUtils, genericUtils, itemUtils} from '../utils.js';
import {ItemMedkit} from '../applications/medkit-item.js';
import {EffectMedkit} from '../applications/medkit-effect.js';
import {ActorMedkit} from '../applications/medkit-actor.js';
import {ActivityMedkit} from '../applications/medkit-activity.js';
import {custom} from '../events/custom.js';
import {compendium} from './compendium.js';
import {EmbeddedMacros} from '../applications/embeddedMacros.js';
export function createHeaderButton(config, buttons) {
    // eslint-disable-next-line no-undef
    if (config instanceof Compendium) {
        let validTypes = ['Actor', 'Item'];
        if (!validTypes.includes(config.collection.metadata.type)) return;
    }
    let embeddedOnlyTypes = ['MeasuredTemplate'];
    let documentType = config.object?.documentName;
    if (genericUtils.getCPRSetting('enableEmbeddedMacrosEditing')) {
        if (documentType) {
            let validTypes = ['MeasuredTemplate', 'Region'];
            if (validTypes.includes(documentType)) {
                buttons.unshift({
                    class: 'chris-premades-embedded-macros',
                    icon: 'fa-solid fa-kit-medical',
                    onclick: () => new EmbeddedMacros(config.object).render(true)
                });
            }
        }
    }
    if (embeddedOnlyTypes.includes(documentType)) return;
    buttons.unshift({
        class: 'chris-premades-item',
        icon: 'fa-solid fa-kit-medical',
        onclick: () => {
            if (config.object instanceof Item) {
                itemMedkit(config.object);
            } else if (config.object instanceof Actor) {
                actorMedkit(config.object);
            } else if (config.object instanceof ActiveEffect) {
                effectMedkit(config.object);
            // eslint-disable-next-line no-undef
            } else if (config.object instanceof Scene) {
                sceneMedkit(config.object);
            // eslint-disable-next-line no-undef
            } else if (config instanceof Compendium) {
                compendiumMedkit(config.collection);
            }
        }
    });
}
async function itemMedkit(item) {
    await ItemMedkit.item(item);
}
async function actorMedkit(actor) {
    await ActorMedkit.actor(actor);
}
async function effectMedkit(effect) {
    await EffectMedkit.effect(effect);
}
async function activityMedkit(activity) {
    await ActivityMedkit.activity(activity);
}
export async function renderItemSheet(app, [elem], options) {
    let isTidy = app?.classList?.contains?.('tidy5e-sheet');
    let headerButton;
    if (isTidy) {
        headerButton = app.element.querySelector('menu.controls-dropdown i.chris-premades-item');
        if (!headerButton) headerButton = elem.closest('.window-header')?.querySelector('.header-control.chris-premades-item');
    } else {
        headerButton = elem.closest('.window-app').querySelector('a.header-button.chris-premades-item');
    }
    if (!headerButton) return;
    let item = app.object;
    if (!item) return;
    let updated = await itemUtils.isUpToDate(item);
    let source = itemUtils.getSource(item);
    let sources = [
        'chris-premades',
        'gambits-premades',
        'midi-item-showcase-community'
    ];
    if (!sources.includes(source) && source) {
        headerButton.style.color = 'pink';
        return;
    }
    switch (updated) {
        case 0: headerButton.style.color = source === 'chris-premades' ? 'red' : 'orange'; return;
        case 1: {
            if (source === 'chris-premades') {
                let identifier = genericUtils.getIdentifier(item);
                if (custom.getMacro(identifier, genericUtils.getRules(item))?.config) {
                    headerButton.style.color = 'dodgerblue';
                } else {
                    headerButton.style.color = 'green';
                }
            } else {
                headerButton.style.color = 'orchid';
            }
            return;
        }
        case -1: {
            let availableItem = await compendiumUtils.getPreferredAutomation(item, {identifier: item?.actor?.flags['chris-premades']?.info?.identifier, rules: genericUtils.getRules(item)});
            if (availableItem) headerButton.style.color = 'yellow';
            return;
        }
        case 2: {
            headerButton.style.color = 'dodgerblue';
        }
    }
}
export async function renderRegionConfig(app, [elem]) {
    if (!genericUtils.getCPRSetting('enableEmbeddedMacrosEditing')) return;
    let existingButton = elem.closest('.window-header').querySelector('button.chris-premades-item');
    let closeButton = elem.closest('.window-header').querySelector('button[data-action="close"]');
    if (existingButton) return;
    let medkitButton = document.createElement('button');
    medkitButton.setAttribute('class', 'header-control fa-solid fa-kit-medical chris-premades-item');
    medkitButton.onclick = () => new EmbeddedMacros(app.document).render(true);
    closeButton.parentNode.insertBefore(medkitButton, closeButton);
}
export async function renderActivitySheet(app, [elem]) {
    if (!(game.settings.get('chris-premades', 'devTools') || genericUtils.getCPRSetting('enableEmbeddedMacrosEditing'))) return;
    let activity = app.activity;
    let existingButton = elem.closest('.window-header').querySelector('button.chris-premades-item');
    let closeButton = elem.closest('.window-header').querySelector('button[data-action="close"]');
    if (existingButton) {
        if (activityUtils.getIdentifier(activity)) {
            existingButton.setAttribute('style', 'color: dodgerblue');
        } else {
            existingButton.setAttribute('style', '');
        }
        return;
    } else {
        let medkitButton = document.createElement('button');
        medkitButton.setAttribute('class', 'header-control fa-solid fa-kit-medical chris-premades-item');
        medkitButton.onclick = () => {
            activityMedkit(activity);
        };
        if (activityUtils.getIdentifier(activity)) medkitButton.setAttribute('style', 'color: dodgerblue');
        closeButton.parentNode.insertBefore(medkitButton, closeButton);
    }
}
export async function renderEffectConfig(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('a.header-button.chris-premades-item');
    if (!headerButton) return;
    let effect = app.object;
    if (!effect) return;
    let cprFlags = effect.flags?.['chris-premades'];
    if (!cprFlags) return;
    let configured = false;
    if (cprFlags.conditions?.length) configured = true;
    if (cprFlags.noAnimation) configured = true;
    if (configured) {
        headerButton.style.color = 'dodgerblue';
    } else {
        headerButton.style.color = '';
    }
}
async function sceneMedkit(scene) {
    let selection = await dialogUtils.buttonDialog(genericUtils.translate('CHRISPREMADES.Generic.CPR') + ': ' + scene.name, undefined, [['CHRISPREMADES.Medkit.Scene.UpdateAll', 'all'], ['CHRISPREMADES.Medkit.Scene.UpdateNPCs', 'npc'], ['CHRISPREMADES.Medkit.Scene.UpdateCharacters', 'character']]);
    if (!selection) return;
    let tokens = scene.tokens.filter(i => i.actor);
    if (selection === 'npcs') {
        tokens = tokens.filter(i => i.actor.type === 'npc');
    } else if (selection === 'character') {
        tokens = tokens.filter(i => i.actor.type === 'character');
    } else {
        let validTypes = ['npc', 'character'];
        tokens = tokens.filter(i => validTypes.includes(i.actor.type));
    }
    genericUtils.notify('CHRISPREMADES.Medkit.Scene.Start', 'info');
    for (let i of tokens) {
        await actorUtils.updateAll(i.actor);
    }
    genericUtils.notify('CHRISPREMADES.Medkit.Scene.Done', 'info');
}
async function compendiumMedkit(pack) {
    if (pack.locked) {
        await compendium.locked(pack);
    } else {
        await compendium.unlocked(pack);
    }
}
export async function renderCompendium(app, html, data) {
    if (!genericUtils.getCPRSetting('addCompendiumButton')) return;
    let header = html[0].querySelector('h4.window-title');
    if (!header) return;
    let button = document.createElement('a');
    button.classList.add('document-id-link');
    button.dataset.tooltip = 'CHRISPREMADES.HeaderButtons.PackId.Tooltip';
    button.dataset.tooltipDirection = 'UP';
    button.addEventListener('click', () => {
        try {
            let id = data.collection.metadata.id;
            navigator.clipboard.writeText(id);
            genericUtils.notify(genericUtils.format('DOCUMENT.IdCopiedClipboard', {id: id, type: 'id', label: genericUtils.translate('PACKAGE.TagCompendium')}), 'info', {localize: false});
        } catch (error) { /* empty */ }
    });
    let icon = document.createElement('i');
    icon.setAttribute('class', 'fa-solid fa-passport');
    button.append(icon);
    header.append(button);
}