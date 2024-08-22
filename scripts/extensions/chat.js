import {Medkit} from '../applications/medkit.js';
import {genericUtils} from '../utils.js';
async function createChatMessage(message, options, userId) {
    let buttonData = message.flags?.['chris-premades']?.button;
    if (!buttonData) return;
    await genericUtils.sleep(100);
    let messageElement = document.querySelector('[data-message-id="' + message.id + '"]');
    if (!messageElement) return;
    switch (buttonData.type) {
        case 'updateItem': {
            let button = messageElement.querySelector('[class="chris-update-item"]');
            if (!button) return;
            button.addEventListener('click', async () => {
                let item = await fromUuid(buttonData.data.itemUuid);
                if (!item) return;
                await Medkit.item(item);
                await message.delete();
            });
        }  
    }
}
let alreadyEnabled = false;
function cssTweak() {
    if (alreadyEnabled) return;
    alreadyEnabled = true;
    let el = document.createElement('style');
    el.type = 'text/css';
    el.innerText = `.dice-result .dice-total:not(.fumble):not(.critical) {
    background: var(--dnd5e-background-5);
    border: 1px solid var(--color-border-light-2);
    color: inherit;
    }`;
    document.head.appendChild(el);
}
export let chat = {
    createChatMessage,
    cssTweak
};