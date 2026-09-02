import {actorUtils, automationUtils, documentUtils, effectUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    if (workflow.failedSaves.size) return;
    const sourceEffectId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'hide', 'effect');
    if (!sourceEffectId) return;
    const effectData = documentUtils.getEffectData(document, sourceEffectId);
    const macros = [];
    const supremeSneak = actorUtils.getItemByIdentifier(workflow.actor, 'supremeSneak');
    if (supremeSneak) {
        macros.push({
            type: 'combat',
            macros: [{source: 'chris-premades', identifier: 'supremeSneakEffect', rules: 'modern'}]
        });
    }
    const {animation} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'hide', rules: 'all'});
    await effectUtils.createEffects(workflow.actor, [effectData], {macros, createAnimation: animation, deleteAnimation: animation});
}
export const hide = {
    rules: 'all',
    version: '2.0.3',
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
        effect: {
            default: '',
            type: 'selectEffect',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Effect'
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