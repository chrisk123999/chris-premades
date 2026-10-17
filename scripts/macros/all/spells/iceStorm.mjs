import {regionUtils} from '../../../proxy.mjs';
async function created({document: region}) {
    const activity = regionUtils.getActivity(region);
    if (activity) await regionUtils.addRegionTimer(activity, region, 1);
}
export const iceStorm = {
    name: 'Ice Storm',
    version: '2.1.3',
    rules: 'all',
    region: [
        {pass: 'created', macro: created, priority: 50}
    ]
};
