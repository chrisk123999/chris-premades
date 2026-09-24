import {documentUtils, genericUtils} from '../../../../../proxy.mjs';
const bonusActions = ['dash', 'disengage', 'help'];
async function beast({summon, updates}) {
    const source = summon.sourceDocument;
    if (documentUtils.getIdentifier(source?.item ?? source) !== 'primal-companion') return;
    updates.items ??= (await summon.getSourceActor()).items.map(item => item.toObject());
    updates.items.forEach(itemData => {
        const activities = Object.values(itemData.system.activities ?? {});
        if (bonusActions.includes(itemData.system.identifier)) {
            activities.forEach(activityData => genericUtils.setProperty(activityData, 'activation.type', 'bonus'));
        }
        if (!activities.some(activityData => activityData.damage?.parts?.length)) return;
        if (!itemData.system.properties?.includes('mgc')) itemData.system.properties?.push('mgc');
    });
}
export const exceptionalTraining = {
    name: 'Exceptional Training',
    version: '2.0.0',
    rules: '2014',
    summon: [
        {
            pass: 'actorPreCreate',
            macro: beast,
            priority: 50
        }
    ]
};
