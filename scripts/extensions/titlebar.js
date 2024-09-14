import * as macros from '../macros.js';
import {compendiumUtils, genericUtils, itemUtils} from '../utils.js';
import {Medkit} from '../applications/medkit.js';
import {EffectMedkit} from '../applications/medkit-effect.js';
import {ActorMedkit} from '../applications/medkit-actor.js';
export function createHeaderButton(config, buttons) {
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
            }
        }
    });
}
async function itemMedkit(item) {
    await Medkit.item(item);
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
    let updated = itemUtils.isUpToDate(item);
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
            let availableItem = await compendiumUtils.getPreferredAutomation(item);
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