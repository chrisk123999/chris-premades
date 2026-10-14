import {automationUtils, documentUtils, effectUtils, itemUtils, Logging} from '../../../proxy.mjs';
import {playTargetAnimations} from '../../generic/spellAnimation.mjs';
async function use({document, workflow}) {
    if (workflow.activity.identifier === 'sprout-foliage-attack') return playTargetAnimations(workflow, automationUtils.getResolvedAnimation(document, 'animation'));
    if (workflow.activity.identifier !== 'sprout-foliage') return;
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'sproutFoliage');
    const attack = itemUtils.getActivityByIdentifier(document, 'sprout-foliage-attack');
    if (!sourceEffect || !attack) return Logging.addMacroWarning('CPR', 'sprout-foliage', 'Sprout Foliage effect or attack activity missing from item.', {notify: 'warn'});
    const existingEffect = documentUtils.getEffectByIdentifier(workflow.actor, 'sproutFoliage');
    if (existingEffect) await documentUtils.deleteDocument(existingEffect);
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {
        activityUuid: workflow.activity.uuid,
        unhideActivities: ['sprout-foliage-attack'],
        favoriteActivities: true,
        vae: [{type: 'use', name: attack.name, itemIdentifier: documentUtils.getIdentifier(document), activityIdentifier: 'sprout-foliage-attack'}]
    });
    effectUtils.pushImageChanges(effectData, document);
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
export const sproutFoliage = {
    name: 'Sprout Foliage',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    get config() {
        return {
            ...effectUtils.getImageConfig(),
            animation: {
                default: {
                    source: 'chris-premades',
                    identifier: 'castTouch'
                },
                type: 'selectAnimation',
                inputs: ['sourceToken', 'targetToken', 'options'],
                label: 'CHRISPREMADES.Config.Animation',
                category: 'animations'
            }
        };
    }
};
