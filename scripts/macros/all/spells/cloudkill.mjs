import {actorUtils, automationUtils, regionUtils} from '../../../proxy.mjs';
async function created({document: region}) {
    await regionUtils.spreadAroundCorners(region);
}
async function drift({document: item}) {
    const token = actorUtils.getFirstToken(item.actor);
    if (!token) return;
    const regions = regionUtils.getPlacedRegions(token.parent, item);
    const center = token.object?.center ?? token.getCenterPoint();
    const step = 10 * token.parent.dimensions.distancePixels;
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'areaAnimation', {source: 'chris-premades', identifier: 'spellAnimation'});
    await Promise.all(regions.map(async region => {
        const {x, y, radius} = regionUtils.getArea(region);
        const distance = Math.hypot(x - center.x, y - center.y);
        if (!distance) return;
        await regionUtils.spreadAroundCorners(region, {area: {x: x + (x - center.x) / distance * step, y: y + (y - center.y) / distance * step, radius}});
        await animation?.macros?.move?.(region, options);
    }));
}
export const cloudkill = {
    name: 'Cloudkill',
    version: '2.1.5',
    rules: 'all',
    region: [
        {pass: 'created', macro: created, priority: 50}
    ],
    combat: [
        {pass: 'actorTurnStart', macro: drift, priority: 50}
    ]
};
