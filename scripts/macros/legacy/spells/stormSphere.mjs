import {documentUtils, regionUtils} from '../../../proxy.mjs';
const boltIdentifier = 'storm-sphere-bolt';
function getSphere(item) {
    return canvas.scene && regionUtils.getPlacedRegions(canvas.scene, item)[0];
}
async function aim({document: item, workflow}) {
    if (workflow.activity.identifier !== boltIdentifier) return;
    if (!workflow.actor.flags['midi-qol']?.ignoreNearbyFoes) {
        await documentUtils.setFlag(workflow.actor, 'midi-qol', 'ignoreNearbyFoes', 1);
        workflow.stormSphereNearbyFoes = true;
    }
    const sphere = getSphere(item);
    const target = workflow.targets.first();
    if (sphere && target?.document.testInsideRegion(sphere)) workflow.tracker.advantage.add('storm-sphere', item.name);
}
async function done({workflow}) {
    if (workflow.activity.identifier === boltIdentifier && workflow.stormSphereNearbyFoes) await documentUtils.setFlag(workflow.actor, 'midi-qol', 'ignoreNearbyFoes', 0);
}
export const stormSphere = {
    name: 'Storm Sphere',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {pass: 'itemAttackRollConfig', macro: aim, priority: 50},
        {pass: 'itemRollFinished', macro: done, priority: 50}
    ]
};
