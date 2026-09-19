import {genericUtils, tokenUtils} from '../../../../../proxy.mjs';
async function early({token}) {
    if (tokenUtils.getLightLevel(token) !== 'bright') return;
    genericUtils.notify('CHRISPREMADES.Macros.All.OneWithShadows.Bright', {type: 'info'});
    return true;
}
export const oneWithShadows = {
    name: 'Eldritch Invocations: One with Shadows',
    version: '2.0.0',
    rules: 'all',
    roll: [
        {pass: 'itemPreTargeting', macro: early, priority: 50}
    ]
};
