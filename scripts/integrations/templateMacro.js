export function templateMacroTitleBarButton(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('a.header-button.templatemacro');
    if (!headerButton) return;
    let object = app.object;
    if (!object) return;
    let flag = object.flags?.templatemacro;
    if (!flag) return;
    if (!Object.keys(flag).length) return;
    headerButton.style.color = 'green';
}