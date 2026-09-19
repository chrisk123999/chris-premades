import {automationUtils, documentUtils, effectUtils, tokenUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    const range = automationUtils.getConfigValue(document, 'range');
    await tokenUtils.teleportToken(workflow.token.document, {range});
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        duration: {rounds: 1},
        specialDuration: ['madeAttack', 'castSpell', 'turnStart']
    });
    effectData.statuses = ['invisible'];
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
export const mistyEscape = {
    name: 'Misty Escape',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        range: {
            default: 60,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        }
    }
};
