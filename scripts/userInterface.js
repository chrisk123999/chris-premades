import {chris} from './helperFunctions.js';
import {registerSelectToolPatch} from './patching.js';
export function tempEffectHUD(app, html, data) {
    if (!app.object) return;
    let statusEffects = html.find('.status-effects');
    let effects = chris.getEffects(app.object.actor).filter(i => i.isTemporary && !i.statuses.size);
    let effectIcons = `${effects.map(effect => `<img class="effect-control active" data-effect-uuid="${effect.uuid}" src="${effect.icon}" title="${effect.name}" data-status-id="${effect.uuid}" />`).join('')}`;
    statusEffects.append(effectIcons);
}
function macroSidebar(app, html, data) {
    let width = Math.floor(parseInt(getComputedStyle(html[0]).getPropertyValue('--sidebar-width')) / (document.querySelector('#sidebar-tabs').childElementCount + 1));
    html[0].querySelector('#sidebar-tabs').style.setProperty('--sidebar-tab-width', width + 'px');
    let tab = document.createElement('a');
    tab.classList.add('item');
    tab.dataset.tab = 'macros';
    tab.dataset.tooltip = 'DOCUMENT.Macros';
    if (!('tooltip' in game)) tab.title = 'Macros';
    let icon = document.createElement('i');
    icon.setAttribute('class', CONFIG.Macro.sidebarIcon);
    tab.append(icon);
    if (!document.querySelector('#sidebar-tabs > [data-tab="macros"]')) document.querySelector('#sidebar-tabs > [data-tab="compendium"]').before(tab);
}
function macroSidebarTab(app, html, data) {
    if (app.tabName === 'macros' && !app.popOut) {
        if (document.querySelectorAll('#macros').length <= 1) document.querySelector('#sidebar').append(html[0]);
        document.querySelector('#macros').classList.add('tab');
        html[0].style.display = '';
    }
}
class MacroSidebarDirectory extends DocumentDirectory {
    static documentName = 'Macro';
    activateListeners(html) {
        super.activateListeners(html);
        html[0].querySelectorAll('.directory-list .thumbnail, .directory-list .profile').forEach(el => {
            el.classList.add('sidebar-macros-execute');
            el.addEventListener('click', this._onClickThumbnail.bind(this));
        });
    }
    _getEntryContextOptions() {
        let options = super._getEntryContextOptions();
        return [
            {
                name: 'Execute',
                icon: '<i class="fas fa-terminal"></i>',
                condition: data => {
                    const macro = game.macros.get(data[0].dataset.entityId || data[0].dataset.documentId);
                    return macro.canExecute;
                },
                callback: data => {
                    const macro = game.macros.get(data[0].dataset.entityId || data[0].dataset.documentId);
                    macro.execute();
                },
            },
        ].concat(options);
    }
    _onClickThumbnail(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const documentId = element.parentElement.dataset.documentId ?? element.parentElement.dataset.entityId;
        const document = this.collection.get(documentId);
        document.execute();
    }
}
export function enableMacroSidebar() {
    CONFIG.ui.macros = MacroSidebarDirectory;
    Hooks.on('renderSidebar', macroSidebar);
    Hooks.on('renderSidebarTab', macroSidebarTab);
}
function placeableRefresh(placeable) {
    if (placeable.controlled) placeable.controlIcon.border.visible = true;
}
async function getControlButtons(controls) {
    let added_tools = [];
    for (let i = 0; i < controls.length; i++) {
        if (controls[i].name === 'lighting') {
            if (!controls[i].tools.find((tool) => tool.name === 'select')) {
                controls[i].tools.unshift({
                    'name': 'select',
                    'title': 'CONTROLS.LightSelect',
                    'icon': 'fas fa-expand',
                });
                added_tools.push('AmbientLight');
            }
        } else if (controls[i].name === 'sounds') {
            if (!controls[i].tools.find((tool) => tool.name === 'select')) {
                controls[i].tools.unshift({
                    'name': 'select',
                    'title': 'CONTROLS.SoundSelect',
                    'icon': 'fas fa-expand',
                });
                added_tools.push('AmbientSound');
            }
        } else if (controls[i].name === 'measure') {
            if (!controls[i].tools.find((tool) => tool.name === 'select')) {
                controls[i].tools.unshift({
                    'name': 'select',
                    'title': 'CONTROLS.TemplateSelect',
                    'icon': 'fas fa-expand',
                });
                added_tools.push('MeasuredTemplate');
            }
        }
    }
}
async function canvasReady() {
    canvas.getLayerByEmbeddedName('AmbientLight').options.controllableObjects = true;
    canvas.getLayerByEmbeddedName('AmbientSound').options.controllableObjects = true;
    canvas.getLayerByEmbeddedName('MeasuredTemplate').options.controllableObjects = true;
    canvas.getLayerByEmbeddedName('Note').options.controllableObjects = true;
}
export async function enableSelectTool() {
    Hooks.on('getSceneControlButtons', getControlButtons);
    Hooks.on('canvasReady', canvasReady);
    let types = ['AmbientSound', 'MeasuredTemplate', 'AmbientLight', 'Note'];
    for (let i of types) Hooks.on('refresh' + i, placeableRefresh);
    Hooks.on('drawNote', async (note) => {
        await warpgate.wait(10);
        placeableRefresh(note);
    });
    registerSelectToolPatch();
}