import {genericUtils} from '../utils.js';
function configureUI() {
    let customUIButtonScale = genericUtils.getCPRSetting('customUIButtonScale');
    if (customUIButtonScale) buttonScale(customUIButtonScale);
    let customUINavigationScale = genericUtils.getCPRSetting('customUINavigationScale');
    if (customUINavigationScale) navigationScale(customUINavigationScale);
    if (genericUtils.getCPRSetting('customSidebar')) customSidebar(true);
    if (genericUtils.getCPRSetting('customChatMessage')) customChatMessage(true);
    if (genericUtils.getCPRSetting('compactMode')) compactMode(true);
}
function setBodyProperty(key, value) {
    document.body.style.setProperty(key, String(value));
}
function buttonScale(value) {
    setBodyProperty('--custom-ui-button-scale', value);
    if (value != 1) {
        let el = document.createElement('style');
        el.id = 'cpr-ui-button-scale';
        el.innerHTML = `
            body #interface #ui-left #ui-left-column-1 #scene-controls {
                transform: scale(var(--custom-ui-button-scale));
                transform-origin: top left;
            }
            body #interface #ui-left #ui-left-column-1 {
                --control-size: calc(var(--custom-ui-button-scale) * 32px);
            }
            body #interface #ui-right #sidebar #sidebar-tabs {
                transform: scale(var(--custom-ui-button-scale));
                transform-origin: top right;
            }
        `;
        document.querySelector('head').appendChild(el);
    } else {
        document.querySelector('#cpr-ui-button-scale')?.remove();
    }
}
function navigationScale(value) {
    setBodyProperty('--custom-ui-navigation-scale', value);
    if (value) {
        let el = document.createElement('style');
        el.id = 'cpr-ui-navigation-scale';
        el.innerHTML = `
            body #interface #ui-left #ui-left-column-2 {
                transform: scale(var(--custom-ui-navigation-scale));
                transform-origin: top left;
            }
        `;
        document.querySelector('head').appendChild(el);
    } else {
        document.querySelector('#cpr-ui-navigation-scale')?.remove();
    }
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
    } else {
        document.querySelector('#cpr-custom-sidebar')?.remove();
    }
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
        document.querySelector('#cpr-custom-chat-message')?.remove();
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
function compactMode(value) {
    if (value) {
        let el = document.createElement('style');
        el.id = 'cpr-compact-mode';
        el.innerHTML = `
            /* Compact mode for chris-premades dialogs and forms - scoped to .cpr- classes only */

            /* Limit dialog max height to 50vh */
            .cpr-dialog {
                max-height: 50vh;
            }

            /* Override button image height expansion */
            .cpr-dialog button:has(img) {
                height: auto !important;
            }

            /* Limit button images to 32px */
            .cpr-dialog button img {
                max-height: 32px;
                max-width: 32px;
            }

            /* Reduce form group spacing in dialogs */
            .cpr-dialog .form-group {
                margin-bottom: 0.375rem;
            }

            /* Reduce form group spacing in settings */
            form.cpr-settings.categories .form-group {
                margin-bottom: 0.375rem;
            }

            /* Reduce row padding and gaps */
            .cpr-row-center {
                padding: 0.5%;
                gap: 0.375rem;
            }

            /* Compact input fields */
            .cpr-dialog input[type="text"],
            .cpr-dialog input[type="number"],
            .cpr-dialog select,
            .cpr-dialog textarea {
                padding: 0.25rem 0.5rem;
            }

            /* Keep button padding minimal (original is 0) */
            .cpr-dialog button.form-button {
                padding: 0;
            }

            /* Reduce fieldset padding */
            .cpr-fieldset-group fieldset {
                padding: 0.5rem;
            }

            /* Compact medkit tabs */
            .cpr-medkit-tabs {
                gap: 0.25rem;
                padding: 0.25rem;
            }

            .cpr-medkit-tabs .item {
                padding: 0.25rem 0.5rem;
            }

            /* Reduce medkit content padding */
            .cpr-medkit-tab {
                padding: 0.5rem;
            }

            /* Compact multi-select rows */
            .cpr-multi-select-row {
                gap: 0.25rem;
                margin-bottom: 0.25rem;
            }

            /* Reduce label spacing */
            .cpr-dialog label {
                margin-bottom: 0.125rem;
            }

            form.cpr-settings label {
                margin-bottom: 0.125rem;
            }

            /* Compact hint text */
            .cpr-dialog .hint {
                margin-top: 0.125rem;
                font-size: 0.9em;
            }

            form.cpr-settings .hint {
                margin-top: 0.125rem;
                font-size: 0.9em;
            }

            /* Reduce window content padding for cpr applications */
            .application.cpr-dialog > .window-content,
            .application.cpr-settings > .window-content {
                padding: 0.5rem;
            }

            /* Compact config flex layouts */
            .cpr-config-flex {
                gap: 0.375rem;
            }

            /* Compact input flex */
            .cpr-input-flex {
                gap: 0.375rem;
            }

            /* Compact npc amounts */
            .cpr-npc-amounts {
                gap: 0.25rem;
            }

            /* Compact notifications */
            .cpr-notification {
                padding: 0.375rem;
                margin-bottom: 0.25rem;
            }
        `;
        document.querySelector('head').appendChild(el);
    } else {
        document.querySelector('#cpr-compact-mode')?.remove();
    }
}
export let ui = {
    configureUI: configureUI,
    setBodyProperty: setBodyProperty,
    customSidebar: customSidebar,
    customChatMessage: customChatMessage,
    chatMessageThemeHook: chatMessageThemeHook,
    compactMode: compactMode
};
