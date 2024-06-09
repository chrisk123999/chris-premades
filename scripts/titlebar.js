import * as macros from './macros.js';
import {compendiumUtils, itemUtils} from './utils.js';
export function createHeaderButton(config, buttons) {
    buttons.unshift({
        class: 'chris-premades-item',
        icon: 'fa-solid fa-kit-medical',
        onclick: () => {
            if (config.object instanceof Item) {
                itemMedkit(config.object);
            } else if (config.object instanceof Actor) {
                actorMedkit(config.object);
            }
        }
    });
}
async function itemMedkit(item) {
    let automations = await compendiumUtils.getAllAutomations(item);
    console.log(automations);

    //Item Medkit Dialog Here!
}
async function actorMedkit(actor) {
    //Actor Medkit Dialog Here!
}
export async function renderItemSheet(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('a.header-button.chris-premades-item');
    if (!headerButton) return;
    let item = app.object;
    if (!item) return;
    let updated = itemUtils.isUpToDate(item);
    let source = itemUtils.getSource(item);
    if (source === 'Other') {
        headerButton.style.color = 'pink';
        return;
    }
    switch (updated) {
        case 0: headerButton.style.color = source === 'CPR' ? 'red' : 'orange'; return;
        case 1: {
            if (source === 'CPR') {
                let identifier = itemUtils.getIdentifer(item);
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
    }
}