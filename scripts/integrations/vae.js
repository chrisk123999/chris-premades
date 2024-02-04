import {chris} from '../helperFunctions.js';
export function vaeEffectDescription(effect, updates, options, id) {
    if (!effect.parent) return;
    if (effect.parent.constructor.name != 'Actor5e') return;
    if (!effect.origin) return;
    let origin = fromUuidSync(effect.origin);
    if (!origin) return;
    if (origin.constructor.name != 'Item5e') return;
    if (!updates.flags?.['visual-active-effects']?.data?.content) {
        if (game.settings.get('chris-premades', 'No NPC VAE Descriptions')) {
            if (origin.actor?.type === 'npc' && origin.actor.id != effect.parent.id) return;
        }
        setProperty(updates, 'flags.visual-active-effects.data.content', origin.system.description.value);
    } else {
        return;
    }
    effect.updateSource({'flags.visual-active-effects': updates.flags['visual-active-effects']});
}
export async function vaeTempItemButton(effect, buttons) {
    let name = effect.flags['chris-premades']?.vae?.button;
    if (!name) return;
    if (name === 'Dismiss Summon') {
        buttons.push({
            'label': name,
            'callback': async function(){
                await chris.removeEffect(effect);
            }
        });
    } else {
        buttons.push({
            'label': 'Use: ' + name,
            'callback': async function(){
                let item = effect.parent.items.getName(name);
                if (item) {
                    await item.use();
                } else {
                    ui.notifications.warn(name + ' item not found!');
                }
            }
        });
    }
}