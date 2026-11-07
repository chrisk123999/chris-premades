import {actorUtils, automationUtils, documentUtils, effectUtils, genericUtils, rollUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    if (workflow.failedSaves.size) return;
    const total = workflow.saveResults?.[0]?.total;
    const dc = automationUtils.getGenericConfigValue(document, 'chris-premades', 'hide', 'dc');
    if (dc && total < rollUtils.rollDiceSync(String(dc), {document}).total) return;
    const existing = actorUtils.getEffectByStatusID(workflow.actor, 'hiding');
    if (existing) await documentUtils.deleteDocument(existing);
    const effectData = (await ActiveEffect.implementation.fromStatusEffect('hiding')).toObject();
    genericUtils.setProperty(effectData, 'flags.midi-qol.hidden.dc', total);
    genericUtils.setProperty(effectData, 'flags.dae.specialDuration', ['1Attack']);
    const {animation} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'hide', rules: 'all'});
    await effectUtils.createEffects(workflow.actor, [effectData], {createAnimation: animation, deleteAnimation: animation, effectOptions: {keepId: true}});
}
/**
 * Gives the user the system's Hiding condition once the roll finishes, unless the check failed.
 * The check total is the DC to find them, and attacking ends it.
 * Bound on an activity. Fires on `activityRollFinished`.
 *
 * Config:
 * - `dc`: formula the check total must reach. Leave blank for no DC.
 * - `animation`: played when the condition is created and deleted.
 */
export const hide = {
    rules: 'all',
    version: '2.1.8',
    category: 'mechanics',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        dc: {
            default: '',
            type: 'formula',
            deterministic: true,
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.DC',
            hint: 'CHRISPREMADES.Macros.Generic.Hide.DCHint'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'hide'
            },
            type: 'selectAnimation',
            inputs: ['effect', 'token', 'config'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: ''
        }
    }
};
