import {automationUtils, regionUtils} from '../../../proxy.mjs';
import {playAreaAnimation} from '../../generic/areaAnimation.mjs';
import {prepareMovableRegion} from '../../generic/moveRegion.mjs';
import {moved} from '../../all/spells/moonbeam.mjs';
async function created({document: region, workflow}) {
    const originItem = regionUtils.getActivity(region)?.item;
    if (!originItem) return;
    await prepareMovableRegion(region, originItem, 'conjure-celestial-move');
    playAreaAnimation(workflow, automationUtils.getResolvedAnimation(originItem, 'animation'), {region});
}
export const conjureCelestial = {
    name: 'Conjure Celestial',
    version: '2.1.4',
    rules: '2024',
    region: [
        {pass: 'created', macro: created, priority: 50},
        {pass: 'moved', macro: moved, priority: 50}
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'conjureCelestial'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'region', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
