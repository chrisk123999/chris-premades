import {genericUtils} from './genericUtils.js';
let damageTypeOptions = [];
let colors = {
    red: '',
    orange: '',
    yellow: '',
    green: '',
    blue: '',
    purple: ''
};
function updateStrings() {
    damageTypeOptions = Object.entries(CONFIG.DND5E.damageTypes).map(i => ({label: i[1].label, value: i[0]}));
    colors = Object.keys(colors).forEach(i => {
        colors[i] = genericUtils.translate('CHRISPREMADES.colors.' + i);
    });
}
async function buttonMenu({title, description, buttons}) {

}
export let dialogUtils = {
    buttonMenu,
    updateStrings,
    damageTypeOptions,
    colors
};