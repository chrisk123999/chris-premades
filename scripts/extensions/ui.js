function configureUI() {
    let customUIButtonScale = game.settings.get('chris-premades', 'customUIButtonScale');
    setBodyProperty('--custom-ui-button-scale', customUIButtonScale);
    let customUINavigationScale = game.settings.get('chris-premades', 'customUINavigationScale');
    setBodyProperty('--custom-ui-navigation-scale', customUINavigationScale);
    if (game.settings.get('chris-premades', 'customSidebar')) customSidebar(true);
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
export let ui = {
    configureUI: configureUI,
    setBodyProperty: setBodyProperty,
    customSidebar: customSidebar
};