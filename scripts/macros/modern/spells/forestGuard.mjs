import {automationUtils, constants, documentUtils, effectUtils, genericUtils, itemUtils, Logging, summonUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
import {getDamageType} from '../../generic/spellAnimation.mjs';
function getNearbyShrubs(item, targetToken) {
    return summonUtils.getSummonsBySource(item)
        .filter(summon => summon.token)
        .map(summon => ({token: summon.token, distance: tokenUtils.getDistance(summon.token, targetToken)}))
        .filter(shrub => shrub.distance <= automationUtils.getConfigValue(item, 'shrubRange'))
        .sort((a, b) => a.distance - b.distance)
        .map(shrub => shrub.token);
}
async function created({document, summon}) {
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'forestGuardThorns');
    const lash = itemUtils.getActivityByIdentifier(document, 'forest-guard-lash');
    if (!sourceEffect || !lash) return Logging.addMacroWarning('CPR', 'forest-guard', 'Thorns effect or lash activity missing from item.', {notify: 'warn'});
    const effectData = documentUtils.getEffectData(document, sourceEffect.id, {activityUuid: lash.uuid});
    genericUtils.setProperty(effectData, 'flags.cat.identifier', 'forestGuardThorns' + summon.actor.id);
    await effectUtils.createEffects(summon.actor, [effectData]);
    await itemUtils.unhideActivities(document, ['forest-guard-attack'], {favorite: true});
}
async function deleted({document, summon}) {
    if (summonUtils.getSummonsBySource(document).some(other => other !== summon)) return;
    await itemUtils.rehideActivities(document, ['forest-guard-attack'], {favorite: true});
}
function early({document, workflow}) {
    if (workflow.activity.identifier !== 'forest-guard-attack') return;
    const targetToken = workflow.targets.first();
    if (!targetToken || getNearbyShrubs(document, targetToken.document).length) return;
    Logging.addMacroWarning('CPR', 'forest-guard', 'CHRISPREMADES.Macros.Modern.ForestGuard.NoShrub', {notify: 'info', format: {distance: automationUtils.getConfigValue(document, 'shrubRange')}});
    return true;
}
async function damage({document, workflow}) {
    if (workflow.activity.identifier !== 'forest-guard-attack' || !workflow.hitTargets.size) return;
    const shrubCount = getNearbyShrubs(document, workflow.hitTargets.first().document).length;
    if (shrubCount <= 1) return;
    await workflowUtils.bonusDamage(workflow, (shrubCount - 1) + automationUtils.getConfigValue(document, 'bonusDie'));
}
function late({document, workflow}) {
    if (!['forest-guard-attack', 'forest-guard-lash'].includes(workflow.activity.identifier)) return;
    const targetToken = workflow.targets.first();
    if (!targetToken) return;
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    if (!animation?.macros?.play) return;
    const [shrubToken] = getNearbyShrubs(document, targetToken.document);
    const sourceToken = shrubToken ?? workflow.token?.document;
    if (!sourceToken) return;
    animation.macros.play(sourceToken, targetToken.document, {...options, damageType: getDamageType(workflow), hit: workflow.hitTargets.has(targetToken)});
}
export const forestGuard = {
    name: 'Forest Guard',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: early,
            priority: 50
        },
        {
            pass: 'itemDamageRollBonuses',
            macro: damage,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: late,
            priority: 50
        }
    ],
    summon: [
        {
            pass: 'create',
            macro: created,
            priority: 50
        },
        {
            pass: 'delete',
            macro: deleted,
            priority: 50
        }
    ],
    config: {
        shrubRange: {
            default: 10,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        },
        bonusDie: {
            default: 'd4',
            type: 'select',
            label: 'CHRISPREMADES.Config.DieSize',
            category: 'homebrew',
            get options() { return constants.diceSizeOptions; }
        },
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
    }
};
