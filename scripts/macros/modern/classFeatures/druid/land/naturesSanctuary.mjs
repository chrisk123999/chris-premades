import {documentUtils, regionUtils} from '../../../../../proxy.mjs';
import {prepareMovableRegion} from '../../../../generic/moveRegion.mjs';
import {getLand} from './circleOfTheLandSpells.mjs';
async function prepare({activity, actor}) {
    if (activity.identifier !== 'natures-sanctuary') return;
    const land = getLand(actor);
    const ids = ['cover', land].filter(Boolean).map(key => activity.item.effects.find(effect => effect.flags['chris-premades']?.naturesSanctuary === key)?.id).filter(Boolean);
    const current = activity.flags.cat?.placed?.region?.effects ?? [];
    if (current.join() !== ids.join()) await documentUtils.update(activity, {'flags.cat.placed.region.effects': ids});
}
async function created({document: region}) {
    const item = regionUtils.getActivity(region)?.item;
    if (item) await prepareMovableRegion(region, item, 'natures-sanctuary-move');
}
async function ended({document: item, effect}) {
    if (!['incapacitated', 'dead'].some(status => effect.statuses.has(status))) return;
    const regions = game.scenes.contents.flatMap(scene => scene.regions.filter(region => regionUtils.getActivity(region)?.item === item));
    await Promise.all(regions.map(region => documentUtils.deleteDocument(region)));
}
export const naturesSanctuary = {
    name: 'Nature\'s Sanctuary',
    version: '2.1.11',
    rules: '2024',
    effect: [
        {
            pass: 'actorCreated',
            macro: ended,
            priority: 50
        }
    ],
    region: [
        {
            pass: 'created',
            macro: created,
            priority: 50
        }
    ],
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: prepare,
            priority: 50
        }
    ]
};
