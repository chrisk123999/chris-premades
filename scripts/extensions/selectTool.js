import {genericUtils} from '../utils.js';
async function getControlButtons(controls) {
    let types = ['lighting', 'sounds', 'templates'];
    types.forEach(type => {
        if (!controls[type].tools.select) {
            controls[type].tools.select = {
                icon: 'fas fa-expand',
                name: 'select',
                order: 0,
                title: 'CONTROLS.' + type.capitalize() + 'Select'
            };
        }
    });
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