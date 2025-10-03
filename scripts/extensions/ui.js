import {genericUtils} from '../utils.js';
function configureUI() {
    let customUIButtonScale = genericUtils.getCPRSetting('customUIButtonScale');
    setBodyProperty('--custom-ui-button-scale', customUIButtonScale);
    let customUINavigationScale = genericUtils.getCPRSetting('customUINavigationScale');
    setBodyProperty('--custom-ui-navigation-scale', customUINavigationScale);
    if (genericUtils.getCPRSetting('customSidebar')) customSidebar(true);
    if (genericUtils.getCPRSetting('customChatMessage')) customChatMessage(true);
}
function setBodyProperty(key, value) {
    document.body.style.setProperty(key, String(value));
}
function customSidebar(value) {
    if (value) {
        let el = document.createElement('style');
        el.id = 'cpr-custom-sidebar';
        el.innerHTML = `
            body #interface #ui-right #sidebar #sidebar-content {
                #chat {
                    width: auto;
                    background: var(--sidebar-background, var(--color-cool-5-90));
                    .chat-scroll {
                        direction: ltr;
                    }
                    .chat-form .jump-to-bottom {
                        right: 4px;
                    }
                }
                .sidebar-tab {
                    box-shadow: 0 0 10px #000;
                }
            }
        `;
        document.querySelector('head').appendChild(el);
    } else document.querySelector('#cpr-custom-sidebar').remove();
}
function customChatMessage(value) {
    if (value) {
        let el = document.createElement('style');
        el.id = 'cpr-custom-chat-message';
        el.innerHTML = `
            :is(.chat-popout, #chat-log, .chat-log) {
                .message::before {
                    background: var(--dnd5e-color-dark-gray) url(../../../ui/denim075.png);
                }
                .message {
                    .flavor-text {
                        color: var(--color-text-secondary)
                    }
                    .message-content {
                        color: var(--color-text-primary);
                        .chat-card .description {
                            background: var(--dnd5e-background-card);
                            border-color: transparent;
                        }
                        .dice-result .dice-total.success:not(.fumble),
                        .dice-result .dice-total.critical {
                            background: color-mix(in oklab, var(--dnd5e-color-success-critical) 35%, transparent);
                            color: var(--dnd5e-color-success-background);
                            box-shadow: none;
                        }
                        .dice-result .dice-total.failure:not(.critical),
                        .dice-result .dice-total.fumble {
                            background: color-mix(in oklab, var(--dnd5e-color-failure-critical) 20%, transparent);
                            color: var(--dnd5e-color-failure-background);
                            box-shadow: none;
                        }
                        .dice-tooltip .dice-rolls .roll.discarded, .dice-tooltip .dice-rolls .roll.rerolled {
                            color: #000;
                            filter: opacity(0.7);
                        }
                        .midi-qol-tooltiptext {
                            background: var(--dnd5e-color-dark-gray) url(../../../ui/denim075.png);
                        }
                    }
                }
            }
            :is(.chat-popout, #chat-log, .chat-log) .midi-results .target.failure,
            .midi-results .target.failure  {
                border: var(--dnd5e-color-failure) 1px solid;
                background-color: color-mix(in oklab, var(--dnd5e-color-failure-critical) 20%, transparent);
                border-radius: 3px;
            }
            :is(.chat-popout, #chat-log, .chat-log) .midi-results .target.success,
            .midi-results .target.success  {
                border: var(--dnd5e-color-success) 1px solid;
                background-color: color-mix(in oklab, var(--dnd5e-color-success-critical) 35%, transparent);
                border-radius: 3px;
            }
        `;
        document.querySelector('head').appendChild(el);
        Hooks.on('renderApplicationV2', chatMessageThemeHook);
        Hooks.once('ready', chatMessageThemeApply);
    } else {
        document.querySelector('#cpr-custom-chat-message').remove();
        Hooks.off('renderApplicationV2', chatMessageThemeHook);
        chatMessageThemeRemove();
    }
}
function chatMessageThemeHook(application, element, context, options) {
    let themedElement = element.matches('.chat-popout.theme-light,.chat-log.theme-light') ? element : element.querySelector('.chat-popout.theme-light,.chat-log.theme-light');
    if (themedElement) {
        themedElement.classList.remove('theme-light');
        themedElement.classList.add('theme-dark');
    }
}
function chatMessageThemeApply() {
    let themedElements = document.querySelectorAll('.chat-popout.theme-light,.chat-log.theme-light');
    themedElements.forEach(el => {
        el.classList.remove('theme-light');
        el.classList.add('theme-dark');
    });
}
function chatMessageThemeRemove() {
    let themedElements = document.querySelectorAll('.chat-popout.theme-dark,.chat-log.theme-dark');
    themedElements.forEach(el => {
        el.classList.remove('theme-dark');
        el.classList.add('theme-light');
    });
}
export let ui = {
    configureUI: configureUI,
    setBodyProperty: setBodyProperty,
    customSidebar: customSidebar,
    customChatMessage: customChatMessage,
    chatMessageThemeHook: chatMessageThemeHook
};