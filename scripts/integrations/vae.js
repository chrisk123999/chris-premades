import {genericUtils} from '../utils.js';
function preCreateActiveEffect(effect, updates, options, id) {
    if (game.user.id != id) return;
    if (effect.parent && effect.transfer) {
        if (effect.parent.constructor != 'Item5e') return;
        if (!genericUtils.getCPRSetting('vaeDescriptionNPC') && parent.actor?.type === 'npc') return;
        genericUtils.setProperty(updates, 'flags.visual-active-effects.data.content', origin.system.description.value);
    } else if (!effect.transfer && effect.parent && effect.origin) {
        if (effect.parent.constructor.name != 'Actor5e') return;
        let origin = fromUuidSync(effect.origin);
        if (!origin) return;
        if (origin.constructor.name != 'Item5e') return;
        if (!updates.flags?.['visual-active-effects']?.data?.content) {
            if (!genericUtils.getCPRSetting('vaeDescriptionNPC')) {
                if (origin.actor?.type === 'npc' && origin.actor.id != effect.parent.id) return;
            }
            genericUtils.setProperty(updates, 'flags.visual-active-effects.data.content', origin.system.description.value);
        }
    } else return;
    effect.updateSource({'flags.visual-active-effects': updates.flags['visual-active-effects']});
}
function createEffectButton(effect, buttons) {
    let buttonData = effect.flags['chris-premades']?.vae?.buttons;
    if (!buttonData) return;
    buttonData.forEach(i => {
        switch (i.type) {
            case 'use':
                buttons.push({
                    label: i.name,
                    callback: () => {
                        let item = (effect.transfer ? effect.parent.actor : effect.parent).items.getName(i.name);
                        if (item) item.use();
                    }
                });
                break;
            case 'dismiss':
                buttons.push({
                    //finish this
                });
        }
    });
}
export let vae = {
    preCreateActiveEffect,
    createEffectButton
};