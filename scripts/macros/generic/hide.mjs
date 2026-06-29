import {actorUtils, animationUtils, automationUtils, documentUtils, effectUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    if (workflow.failedSaves.size) return;
    const sourceEffectId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'hide', 'hideEffectId');
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
    const {animation, animationOptions} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'hide'});
    await effectUtils.createEffects(workflow.actor, [effectData], {macros, animation, animationOptions});
}