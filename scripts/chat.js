import {buttonActors, buttonItem, buttonSettings} from './info.js';
export async function addChatButton(message, options, user) {
    let flagData = message.flags?.['chris-premades']?.message?.button;
    if (!flagData) return;
    await warpgate.wait(100);
    let messageElement = document.querySelector('[data-message-id="' + message.id + '"]');
    if (!messageElement) return;
    if (flagData.settings) {
        let button = messageElement.querySelector('[class="chris-settings-button"]');
        if (button) button.addEventListener('click', () => {
            buttonSettings(flagData.settings, button, message);
        });
    }
    if (flagData.actors) {
        let button = messageElement.querySelector('[class="chris-actors-button"]');
        if (button) button.addEventListener('click', () => {
            buttonActors(flagData.actors, button, message);
        });
    }
    if (flagData.item) {
        let button = messageElement.querySelector('[class="chris-item-button"]');
        if (button) button.addEventListener('click', () => {
            buttonItem(flagData.item, button, message);
        });
    }
}