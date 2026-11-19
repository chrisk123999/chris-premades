import {documentUtils, regionUtils} from '../../../../../proxy.mjs';
async function promptRadiance({document: activity}) {
    return activity;
}
async function radiance({scene, workflow}) {
    if (!workflow.template) return;
    const regions = scene?.regions.filter(r => regionUtils.isMagicalDarkness(r) && regionUtils.hasOverlap(workflow.template, r)).map(r => r.id);
    if (regions.length) await documentUtils.deleteEmbeddedDocuments(scene, 'Region', regions);
}
export const radianceOfTheDawn = {
    name: 'Radiance of the Dawn',
    version: '2.1.9',
    rules: 'all',
    called: [
        {
            pass: 'actorChannelDivinityCleric',
            macro: promptRadiance,
            priority: 200
        }
    ],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: radiance,
            priority: 50
        }
    ]
};
