import {genericUtils} from '../utils.js';

async function getControlButtons(controls) {
    let added_tools = [];
    for (let i = 0; i < controls.length; i++) {
        if (controls[i].name === 'lighting') {
            if (!controls[i].tools.find((tool) => tool.name === 'select')) {
                controls[i].tools.unshift({
                    name: 'select',
                    title: 'CONTROLS.LightSelect',
                    icon: 'fas fa-expand',
                });
                added_tools.push('AmbientLight');
            }
        } else if (controls[i].name === 'sounds') {
            if (!controls[i].tools.find((tool) => tool.name === 'select')) {
                controls[i].tools.unshift({
                    name: 'select',
                    title: 'CONTROLS.SoundSelect',
                    icon: 'fas fa-expand',
                });
                added_tools.push('AmbientSound');
            }
        } else if (controls[i].name === 'measure') {
            if (!controls[i].tools.find((tool) => tool.name === 'select')) {
                controls[i].tools.unshift({
                    name: 'select',
                    title: 'CONTROLS.TemplateSelect',
                    icon: 'fas fa-expand',
                });
                added_tools.push('MeasuredTemplate');
            }
        }
    }
}
function placeableRefresh(placeable) {
    if (placeable.controlled) placeable.controlIcon.border.visible = true;
}
function canvasReady() {
    canvas.getLayerByEmbeddedName('AmbientLight').options.controllableObjects = true;
    canvas.getLayerByEmbeddedName('AmbientSound').options.controllableObjects = true;
    canvas.getLayerByEmbeddedName('MeasuredTemplate').options.controllableObjects = true;
    canvas.getLayerByEmbeddedName('Note').options.controllableObjects = true;
}
function selectToolPatch(...args) {
    Object.getPrototypeOf(AmbientLight).prototype._onDragLeftCancel.apply(this, args);
    this.updateSource({defer: true});
}
async function init() {
    Hooks.on('getSceneControlButtons', getControlButtons);
    Hooks.on('canvasReady', canvasReady);
    let types = ['AmbientSound', 'MeasuredTemplate', 'AmbientLight', 'Note'];
    for (let i of types) Hooks.on('refresh' + i, placeableRefresh);
    Hooks.on('drawNote', async (note) => {
        await genericUtils.sleep(10);
        placeableRefresh(note);
    });
    libWrapper.register('chris-premades', 'AmbientLight.prototype._onDragLeftCancel', selectToolPatch, 'OVERRIDE');
}
export let selectTool = {
    init
};