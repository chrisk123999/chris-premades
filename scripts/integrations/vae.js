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
    createEffectButton
};