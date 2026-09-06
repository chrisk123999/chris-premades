import {documentUtils, tokenUtils} from '../../../../proxy.mjs';
async function use({document, workflow}) {
    if (!workflow.token) return;
    await documentUtils.setFlag(document.item, 'chris-premades', 'etherealFade', {
        location: {
            x: workflow.token.document.x,
            y: workflow.token.document.y,
            height: workflow.token.document.height,
            level: workflow.token.document.level
        },
        sceneId: workflow.token.document.scene.id
    });
}
async function end({document, workflow}) {
    if (workflow.token) {
        const sceneId = document.item.flags['chris-premades']?.etherealFade?.sceneId;
        if (!sceneId) return;
        if (sceneId !== workflow.token.document.scene.id) {
            await documentUtils.deleteDocument(workflow.token.document); // When I'm not lazy make this make a token on the old scene if it exists.
        } else {
            const location = document.item.flags['chris-premades']?.etherealFade?.location;
            await documentUtils.update(workflow.token.document, location, {animate: false});
        }
    }
    const effect = documentUtils.getEffectByIdentifier(workflow.actor, 'etherealFadeEffect');
    if (!effect) return;
    await documentUtils.deleteDocument(effect);
}
export const etherealFade = {
    name: 'Ethereal Fade',
    version: '2.0.3',
    rules: '2024',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
export const etherealFadeEnd = {
    name: 'Etheral Fade: End',
    version: etherealFade.version,
    rules: etherealFade.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: end,
            priority: 50
        }
    ]
};