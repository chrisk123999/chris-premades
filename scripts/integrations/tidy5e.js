import {EmbeddedMacros} from '../applications/embeddedMacros.js';
import {ItemMedkit} from '../applications/medkit-item.js';
import {genericUtils} from '../utils.js';
function itemTitleBar(api) {
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
    if (!genericUtils.getCPRSetting('enableEmbeddedMacrosEditing')) return;
    api.registerItemHeaderControls({
        controls: [
            {
                icon: 'fa-solid fa-feather-pointed chris-premades-embedded-macros',
                label: 'CHRISPREMADES.Medkit.EmbeddedMacros.Label',
                position: 'header',
                async onClickAction() {
                    await new EmbeddedMacros(this.document).render(true);
                }
            }
        ]
    });
}
export let tidy5e = {
    itemTitleBar
};