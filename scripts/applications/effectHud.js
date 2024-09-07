import {actorUtils, genericUtils} from '../utils.js';
function renderTokenHUD(app, html, data) {
    if (!app.object) return;
    let statusEffects = html.find('.status-effects');
    let effects = actorUtils.getEffects(app.object.actor).filter(i => {
        if (CONFIG.statusEffects.find(j => j._id === i._id)) return false;
        if (!i.isTemporary) return false;
        return true;
    });
    let effectIcons = effects.map(effect => '<img class="effect-control active" data-effect-uuid="' + effect.uuid + '" src="' + effect.img + '" title="' + effect.name + '" data-status-id="' + effect.name + '" />').join('');
    statusEffects.append(effectIcons);
}
function onToggleEffect(event, {overlay = false} = {}) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.actor) return ui.notifications.warn('HUD.WarningEffectNoActor', {localize: true});
    let statusId = event.currentTarget.dataset.statusId;
    let dataset = event.currentTarget.dataset;
    let effectUuid = dataset.effectUuid;
    if (effectUuid) {
        let effect = fromUuidSync(effectUuid);
        if (effect) genericUtils.remove(effect);
    } else {
        this.actor.toggleStatusEffect(statusId, {overlay});
    }
}
function activateListeners(wrapped, ...args) {
    let html = args[0];
    wrapped(html);
    let effectsTray = html.find('.status-effects');
    effectsTray.off('click');
    effectsTray.on('click', '.effect-control', onToggleEffect.bind(this));
}
export async function patchToggleEffect(enabled) {
    if (enabled) {
        libWrapper.register('chris-premades', 'TokenHUD.prototype.activateListeners', activateListeners, 'MIXED');
        Hooks.on('renderTokenHUD', renderTokenHUD);
    } else {
        libWrapper.unregister('chris-premades', 'TokenHUD.prototype.activateListeners');
        Hooks.off('renderTokenHUD', renderTokenHUD);
    }
}
export let effectHud = {
    patchToggleEffect
};