import {distanceUtils, regionUtils} from '../../../proxy.mjs';
import {prepareMovableRegion} from '../../generic/moveRegion.mjs';
async function created({document: region}) {
    const item = regionUtils.getActivity(region)?.item;
    if (!item) return;
    await prepareMovableRegion(region, item, 'dawn-move');
    const radius = distanceUtils.toFeet(region.parent, regionUtils.getArea(region).radius / region.parent.dimensions.distancePixels);
    await regionUtils.createRegionLight(region, {bright: radius});
}
export const dawn = {
    name: 'Dawn',
    version: '2.1.3',
    rules: '2014',
    region: [
        {pass: 'created', macro: created, priority: 50}
    ]
};
