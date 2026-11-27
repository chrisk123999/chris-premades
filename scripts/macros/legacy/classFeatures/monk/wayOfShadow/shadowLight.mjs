import {automationUtils, documentUtils, Logging, tokenUtils} from '../../../../../proxy.mjs';
const config = {
    lightCheck: {
        default: false,
        type: 'checkbox',
        label: 'CHRISPREMADES.Macros.Legacy.WayOfShadow.LightCheck',
        category: 'mechanics'
    }
};
async function early({document: item, token}) {
    if (!automationUtils.getConfigValue(item, 'lightCheck') || !token || tokenUtils.getLightLevel(token) !== 'bright') return;
    Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(item), 'CHRISPREMADES.Macros.All.OneWithShadows.Bright', {notify: 'info'});
    return true;
}
async function moved({document: effect, token}) {
    if (!token || !automationUtils.getOriginConfigValue(effect, 'lightCheck') || tokenUtils.getLightLevel(token) !== 'bright') return;
    await documentUtils.deleteDocument(effect);
}
const roll = [
    {
        pass: 'itemPreTargeting',
        macro: early,
        priority: 50
    }
];
export const shadowStep = {
    name: 'Shadow Step',
    version: '2.1.11',
    rules: '2014',
    config,
    roll
};
export const cloakOfShadows = {
    name: 'Cloak of Shadows',
    version: '2.1.11',
    rules: '2014',
    config,
    roll
};
export const cloakOfShadowsEffect = {
    name: 'Cloak of Shadows: Effect',
    version: '2.1.11',
    rules: '2014',
    move: [
        {
            pass: 'actorMoved',
            macro: moved,
            priority: 50
        }
    ]
};
