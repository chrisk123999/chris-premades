import {actorUtils, genericUtils} from '../utils.js';
function renderTokenHUD(app, html, data, options) {
    if (!app.document) return;
    let statusEffects = html.querySelector('.status-effects');
    let effects = actorUtils.getEffects(app.document.actor).filter(i => {
        if (CONFIG.statusEffects.find(j => j._id === i._id)) return false;
        if (!i.isTemporary) return false;
        return true;
    });
    let effectIcons = effects.map(effect => '<img class="effect-control active" data-effect-uuid="' + effect.uuid + '" src="' + effect.img + '" data-tooltip-text="' + effect.name + '" />').join('');
    let effectIconsTemplate = document.createElement('template');
    effectIconsTemplate.innerHTML = effectIcons;
    statusEffects.append(...effectIconsTemplate.content.children);
    let tempEffects = statusEffects.querySelectorAll('.effect-control[data-effect-uuid]');
    for (let tempEffect of tempEffects) {
        tempEffect.addEventListener('click', onToggleEffect.bind(app));
    }
}
function onToggleEffect(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.actor) return ui.notifications.warn('HUD.WarningEffectNoActor', {localize: true});
    let effectUuid = event.currentTarget.dataset.effectUuid;
    if (effectUuid) {
        let effect = fromUuidSync(effectUuid);
        if (effect) genericUtils.remove(effect);
    }
}
export async function patchToggleEffect(enabled) {
    if (enabled) {
        Hooks.on('renderTokenHUD', renderTokenHUD);
    } else {
        Hooks.off('renderTokenHUD', renderTokenHUD);
    }
}
export let effectHud = {
    patchToggleEffect
};