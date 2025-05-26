import {ItemMedkit} from '../applications/medkit-item.js';
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
}
export let tidy5e = {
    itemTitleBar
};