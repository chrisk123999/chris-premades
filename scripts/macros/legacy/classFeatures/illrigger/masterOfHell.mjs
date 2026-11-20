import {actorUtils, documentUtils, effectUtils, regionUtils} from '../../../../proxy.mjs';
async function darkness({workflow}) {
    const region = workflow.template;
    if (workflow.activity.identifier !== 'darkness' || !region) return;
    await regionUtils.addRegionTimer(workflow.activity, region);
    for (const token of workflow.targets.documents) {
        const effects = actorUtils.getEffects(token.actor).filter(effect => effectUtils.getOriginActivitySync(effect)?.uuid === workflow.activity.uuid);
        await Promise.all(effects.map(effect => documentUtils.setFlag(effect, 'chris-premades', 'masterOfHellRegion', region.uuid)));
    }
}
async function moved({document: effect, token}) {
    const region = fromUuidSync(effect.flags['chris-premades']?.masterOfHellRegion ?? '', {strict: false});
    if (region && !token.regions.has(region)) await documentUtils.deleteDocument(effect);
}
export const masterOfHell = {
    name: 'Master of Hell',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: darkness,
            priority: 50
        }
    ]
};
export const masterOfHellDarkness = {
    name: 'Master of Hell: Darkness',
    version: '2.1.10',
    rules: '2014',
    move: [
        {
            pass: 'actorMoved',
            macro: moved,
            priority: 50
        }
    ]
};
