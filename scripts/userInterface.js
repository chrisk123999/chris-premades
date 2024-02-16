import {chris} from './helperFunctions.js';
export function tempEffectHUD(app, html, data) {
    if (!app.object) return;
    let statusEffects = html.find('.status-effects');
    let effects = chris.getEffects(app.object.actor).filter(i => i.isTemporary && !i.statuses.size);
    let effectIcons = `${effects.map(effect => `<img class="effect-control active" data-effect-uuid="${effect.uuid}" src="${effect.icon}" title="${effect.name}" data-status-id="${effect.uuid}" />`).join('')}`
    statusEffects.append(effectIcons);
}
function macroSidebar(app, html, data) {
    html[0].querySelector('#sidebar-tabs').style.setProperty('--sidebar-tab-width', `${Math.floor(parseInt(getComputedStyle(html[0]).getPropertyValue('--sidebar-width')) / (document.querySelector("#sidebar-tabs").childElementCount + 1))}px`);
    let tab = document.createElement('a');
    tab.classList.add('item');
	tab.dataset.tab = 'macros';
	tab.dataset.tooltip = "DOCUMENT.Macros";
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
export function enableMacroSidebar(value) {
    CONFIG.ui.macros = MacroSidebarDirectory;
    Hooks.on('renderSidebar', macroSidebar);
    Hooks.on('renderSidebarTab', macroSidebarTab);
}