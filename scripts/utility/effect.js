import {constants} from '../constants.js';
import {chris} from '../helperFunctions.js';
export function itemDC(effect, updates, options, user) {
    if (!updates.changes || !effect.parent || !effect.origin) return;
    if (updates.changes.length === 0) return;
    if (effect.parent.constructor.name != 'Actor5e') return;
    let origin = fromUuidSync(effect.origin);
    if (!origin) return;
    if (origin.constructor.name != 'Item5e') return;
    let changed = false;
    for (let i of updates.changes) {
        if (typeof i.value !== 'string') continue;
        if (i.value.includes('$chris.itemDC')) {
            let itemDC = chris.getSpellDC(origin);
            i.value = i.value.replace('$chris.itemDC', itemDC);
            changed = true;
        }
        if (i.value.includes('$chris.itemMod')) {
            let itemMod = chris.getSpellMod(origin);
            i.value = i.value.replace('$chris.itemMod', itemMod);
            changed = true;
        }
    }
    if (!changed) return;
    effect.updateSource({'changes': updates.changes});
}
export async function fixOrigin(token, options, user) {
    if ((game.user.id !== user) || token.actorLink) return;
    let updates = await chris.getEffects(token.actor).reduce(async (updates, effect) => {
        if (!effect.origin) return updates;
        let origin = await fromUuid(effect.origin);
        if (!origin) return updates;
        if (!origin instanceof Item) return updates;
        let item = token.actor.items.get(origin.id);
        if (item) updates.push({'_id': effect.id, 'origin': item.uuid});
        return updates;
    }, []);
    if (Object.keys(updates).length === 0) return;
    await token.actor.updateEmbeddedDocuments('ActiveEffect', updates);
}
export function noEffectAnimationCreate(effect, updates,  options, userId) {
    if (effect.flags['chris-premades']?.effect?.noAnimation) options.animate = false
}
export function noEffectAnimationDelete(effect,  options, userId) {
    if (effect.flags['chris-premades']?.effect?.noAnimation) options.animate = false
}
export function effectTitleBar(config, buttons) {
    if (config.object.parent instanceof Item) {
        buttons.unshift({
            'class': 'chris-premades',
            'icon': 'fa-solid fa-kit-medical',
            'onclick': () => effectConfig(config.object)
        });
    }
}
async function effectConfig(effect) {
    let disableAnimation = effect.flags['chris-premades']?.effect?.noAnimation;
    let vaeButton = effect.flags['chris-premades']?.vae?.button ?? '';
    let inputs = [
        {
            'label': 'Disable Text Animation:',
            'type': 'checkbox',
            'options': disableAnimation ?? false
        },
        {
            'label': 'VAE Button',
            'type': 'text',
            'options': vaeButton
        }
    ]
    let selection = await chris.menu('CPR Effect Options', constants.okCancel, inputs, true);
    if (!selection.buttons) return;
    let refreshedEffect = await fromUuid(effect.uuid);
    if (!refreshedEffect) return;
    let updates = {
        'effects': [
            {
                '_id': refreshedEffect.id,
                'flags': {
                    'chris-premades': {
                        'effect': {
                            'noAnimation': selection.inputs[0]
                        },
                        'vae': {
                            'button': selection.inputs[1] === '' ? null : selection.inputs[1]
                        }
                    }
                }
            }
        ]
    }
    await effect.parent.update(updates);
}