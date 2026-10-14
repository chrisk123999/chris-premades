import cprConstants from '../../../constants.mjs';
import {automationUtils, documentUtils, regionUtils} from '../../../proxy.mjs';
import {playAreaAnimation} from '../../generic/areaAnimation.mjs';
import {createLight} from './darkness.mjs';
async function created({document: region, workflow}) {
    const originItem = regionUtils.getActivity(region)?.item;
    if (!originItem) return;
    if (automationUtils.getConfigValue(originItem, 'spreadAroundCorners')) await regionUtils.spreadAroundCorners(region);
    await documentUtils.update(region, {name: originItem.name});
    if (automationUtils.getConfigValue(originItem, 'useRealDarkness')) await createLight(region, automationUtils.getConfigValue(originItem, 'darknessAnimation'));
    playAreaAnimation(workflow, automationUtils.getResolvedAnimation(originItem, 'animation'), {region});
}
export const fogCloud = {
    name: 'Fog Cloud',
    version: '2.1.3',
    rules: 'all',
    region: [
        {pass: 'created', macro: created, priority: 50}
    ],
    config: {
        spreadAroundCorners: {
            default: true,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.All.FogCloud.SpreadAroundCorners',
            hint: 'CHRISPREMADES.Macros.All.FogCloud.SpreadAroundCornersHint',
            category: 'mechanics'
        },
        useRealDarkness: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.RealDarkness',
            category: 'mechanics'
        },
        darknessAnimation: cprConstants.darknessAnimationConfig,
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'fogCloud'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'region', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
