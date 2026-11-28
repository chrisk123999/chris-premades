import {documentUtils, regionUtils} from '../../../../../proxy.mjs';
async function rest({document: item}) {
    const regions = game.scenes.contents.flatMap(scene => scene.regions.filter(region => regionUtils.getActivity(region)?.item === item));
    await Promise.all(regions.map(region => documentUtils.deleteDocument(region)));
}
async function left({document: region, tokens}) {
    const actor = regionUtils.getActivity(region)?.actor;
    if (actor && tokens?.some(token => token.actor === actor)) await documentUtils.deleteDocument(region);
}
export const hearthOfMoonlightAndShadow = {
    name: 'Hearth of Moonlight and Shadow',
    version: '2.1.11',
    rules: '2014',
    region: [
        {
            pass: 'left',
            macro: left,
            priority: 50
        }
    ],
    rest: [
        {
            pass: 'actorShort',
            macro: rest,
            priority: 50
        }
    ]
};
