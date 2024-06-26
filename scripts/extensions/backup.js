import {DialogApp} from '../applications/dialog.js';
import {genericUtils} from '../utils.js';
async function selectCompendium() {
    let oldCompendiumKey = genericUtils.getCPRSetting('backupCompendium');
    let compendiums = game.packs.filter(i => i.metadata.type === 'Actor');
    let inputs = compendiums.map(i => ({
        label: i.metadata.label,
        name: i.metadata.id,
        options: {isChecked: oldCompendiumKey === i.metadata.id}
    }));
    let selection = await DialogApp.dialog('CHRISPREMADES.settings.backupCompendium.name', 'CHRISPREMADES.settings.backupCompendium.hint', [['radio', inputs, {displayAsRows: true}]], 'okCancel');
    if (!selection) return;
    await game.settings.set('chris-premades', 'backupCompendium', selection.radio);
}
export let backup = {
    selectCompendium
};