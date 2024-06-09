import {compendiumUtils} from './utils.js';
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