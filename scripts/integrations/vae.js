import {genericUtils, itemUtils} from '../utils.js';
function createEffectButtons(effect, buttons) {
    let buttonData = effect.flags['chris-premades']?.vae?.buttons;
    if (!buttonData) return;
    buttonData.forEach(i => {
        switch (i.type) {
            case 'use':
                buttons.push({
                    label: i.name,
                    callback: () => {
                        let actor = effect.transfer ? effect.parent.actor : effect.parent;
                        let item;
                        if (i.identifier) {
                            item = itemUtils.getItemByIdentifer(actor, i.identifier);
                        } else {
                            item = actor.items.getName(i.name);
                        }
                        if (item) item.use();
                    }
                });
                break;
            case 'dismiss':
                buttons.push({
                    label: i.name,
                    callback: () => {
                        genericUtils.remove(effect);
                    }
                });
        }
    });
}
export let vae = {
    createEffectButtons
};