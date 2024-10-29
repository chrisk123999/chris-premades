import * as macros from '../macros.js';
import {actorUtils, compendiumUtils, dialogUtils, genericUtils, itemUtils} from '../utils.js';
import {ItemMedkit} from '../applications/medkit-item.js';
import {EffectMedkit} from '../applications/medkit-effect.js';
import {ActorMedkit} from '../applications/medkit-actor.js';
export function createHeaderButton(config, buttons) {
    // eslint-disable-next-line no-undef
    if (config instanceof Compendium) {
        if (genericUtils.getCPRSetting('addCompendiumButton')) {
            buttons.unshift({
                class: 'document-id-link',
                icon: 'fa-solid fa-passport',
                onclick: () => {
                    try {
                        let id = config.collection.metadata.id;
                        navigator.clipboard.writeText(id);
                        genericUtils.notify(genericUtils.format('DOCUMENT.IdCopiedClipboard', {id: id, type: 'id', label: genericUtils.translate('PACKAGE.TagCompendium')}), 'info', {localize: false});
                    } catch (error) { /* empty */ }
                }
            });
        }
        if (config.collection.locked) return;
        let validTypes = ['Actor']; //Finish this.
        if (!validTypes.includes(config.collection.metadata.type)) return;
    }
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
                compendiumMedkit(config);
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
export async function renderItemSheet(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('a.header-button.chris-premades-item');
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
                if (macros[identifier].config) {
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
            let availableItem = await compendiumUtils.getPreferredAutomation(item, {identifier: item?.actor?.flags['chris-premades']?.info?.identifier});
            if (availableItem) headerButton.style.color = 'yellow';
            return;
        }
        case 2: {
            headerButton.style.color = 'dodgerblue';
        }
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
async function compendiumMedkit(compendium) {
    let selection = await dialogUtils.buttonDialog(genericUtils.translate('CHRISPREMADES.Generic.CPR') + ': ' + compendium.metadata.label, 'CHRISPREMADES.Medkit.Compendium.Apply', [['CHRISPREMADES.Generic.Yes', true], ['CHRISPREMADES.Generic.No', false]]);
    if (!selection) return;
    genericUtils.notify('CHRISPREMADES.Medkit.Compendium.Start', 'info');
    let documents = await compendium.collection.getDocuments();
    if (compendium.collection.metadata.type === 'Actor') {
        for (let i of documents) await actorUtils.updateAll(i);
    } else if (compendium.collection.metadata.type === 'Item') {
        //Finish this.
    }
    genericUtils.notify('CHRISPREMADES.Medkit.Compendium.Done', 'info');
}