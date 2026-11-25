import {actorUtils, automationUtils, documentUtils, effectUtils} from '../../proxy.mjs';
async function created({document: effect}) {
    const scope = automationUtils.getGenericConfigValue(effect, 'chris-premades', 'uniqueEffect', 'scope');
    const identifier = documentUtils.getIdentifier(effect);
    let others;
    if (scope === 'item') {
        others = effect.parent.effects.filter(other => other !== effect && documentUtils.getIdentifier(other) === identifier);
    } else {
        const origin = effectUtils.getOriginActivitySync(effect)?.item;
        const scene = actorUtils.getFirstToken(effect.parent?.actor ?? effect.parent)?.parent ?? canvas.scene;
        if (!origin || !scene) return;
        others = effectUtils.getSceneEffects(scene, identifier, {origin}).filter(other => other !== effect);
    }
    await Promise.all(others.map(other => documentUtils.deleteDocument(other)));
}
/**
 * Removes other effects with this effect's identifier when it is created. It keeps one copy either on the same document
 * or from the same origin item across the scene.
 */
export const uniqueEffect = {
    rules: 'all',
    version: '2.1.11',
    category: 'utility',
    generic: true,
    documents: ['activeeffect'],
    effect: [
        {
            pass: 'created',
            macro: created,
            priority: 40
        }
    ],
    genericConfig: {
        scope: {
            default: 'origin',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UniqueEffect.Scope.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UniqueEffect.Scope.Hint',
            options: [
                {value: 'origin', label: 'CHRISPREMADES.Macros.Generic.UniqueEffect.Origin'},
                {value: 'item', label: 'CHRISPREMADES.Macros.Generic.UniqueEffect.Item'}
            ]
        }
    }
};
