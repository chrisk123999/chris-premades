import {itemUtils} from './utils.js';
import * as macros from './macros.js';

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
    let identifier = itemUtils.getIdentifer(item);                          //Internal Identifier used by CPR
    let name = macros[identifier] ? macros[identifier].name : item.name;    //Item name matched by the identifier, falls back to the actual item name
    let version = itemUtils.getVersion(item);                               //Version string
    let source = itemUtils.getSource(item);                                 //Automation source: "CPR, GPS, MISC, Other" Other will not have version info and should be treated as being unknown for updated.
    let isUpToDate = itemUtils.isUpToDate(item);                            // -1 for Unknown, 0 for No, 1 for Yes

    //Item Medkit Dialog Here!
}
async function actorMedkit(actor) {
    //Actor Medkit Dialog Here!
}