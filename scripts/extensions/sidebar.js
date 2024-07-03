import {constants, genericUtils} from '../utils.js';
function removeCompendiums(directory) {
    // eslint-disable-next-line no-undef
    if (!(directory instanceof CompendiumDirectory)) return;
    let html = directory.element;
    let ol = html.find('ol.directory-list');
    let lis = ol.find('li');
    let hiddenCompendiums = genericUtils.getCPRSetting('hiddenCompendiums');
    let hiddenCompendiumFolders = genericUtils.getCPRSetting('hiddenCompendiumFolders');
    Object.values(lis).filter(i => i.localName === 'li').forEach(element => {
        let pack = element.dataset.pack;
        let folderId = element.dataset.folderId;
        if (!pack || !folderId) return;
        if (pack) {
            if (!genericUtils.getCPRSetting('devTools')) {
                if (Object.values(constants.featurePacks).includes(pack)) element.remove();
                return;
            }
            if (hiddenCompendiums.includes(pack)) element.remove();
            return;
        } else if (folderId) {
            if (hiddenCompendiumFolders.includes(folderId)) element.remove();
            return;
        }
    });
}
async function selectHiddenCompendiums() {
    //Finish this.
}
async function selectHiddenCompendiumFolders() {
    let folders = game.folders.filter(i => i.type === 'Compendium');
    //Finish this.
}
export let sidebar = {
    removeCompendiums,
    selectHiddenCompendiums,
    selectHiddenCompendiumFolders
};