import {ActorMedkit} from '../applications/medkit-actor.js';
import {ItemMedkit} from '../applications/medkit-item.js';
import {custom} from '../events/custom.js';
import {compendiumUtils, genericUtils, itemUtils} from '../utils.js';
function headerControls(api) {
    api.registerItemHeaderControls({
        controls: [
            {
                icon: 'fa-solid fa-kit-medical chris-premades-item',
                label: 'CHRISPREMADES.Medkit.Medkit',
                position: 'header',
                async onClickAction() {
                    await ItemMedkit.item(this.document);
                }
            }
        ]
    });
    api.registerActorHeaderControls({
        controls: [
            {
                icon: 'fa-solid fa-kit-medical chris-premades-item',
                label: 'CHRISPREMADES.Medkit.Medkit',
                position: 'header',
                async onClickAction() {
                    await ActorMedkit.actor(this.document);
                }
            }
        ]
    });
}
async function renderTidyItemSheet(app, elem, options) {
    let headerButton = elem.querySelector('.header-control.chris-premades-item');
    if (!headerButton) return;
    let item = app.document;
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
export let tidy5e = {
    headerControls,
    renderTidyItemSheet
};