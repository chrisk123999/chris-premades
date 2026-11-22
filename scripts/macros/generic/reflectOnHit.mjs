import {actorUtils, automationUtils, combatUtils, documentUtils, effectUtils, Logging, tokenUtils, workflowUtils} from '../../proxy.mjs';
import {attackTypeConfig} from './damageBonusToOneRoll.mjs';
function isStrongest(effect, actor) {
    const castLevel = documentUtils.getSavedCastData(effect).castLevel;
    return !actorUtils.getEffects(actor).some(other => {
        if (other === effect || !other.active || other.name !== effect.name) return false;
        const otherLevel = documentUtils.getSavedCastData(other).castLevel;
        return otherLevel > castLevel || (otherLevel === castLevel && other.id < effect.id);
    });
}
async function attacked({document: effect, sourceToken, workflow, castData}) {
    if (!workflow.token || workflow.token.document === sourceToken) return;
    if (!workflow.hitTargets.has(sourceToken)) return;
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'reflectOnHit', configKeys);
    if (!workflowUtils.isAttackType(workflow, config.attackType || 'attack')) return;
    if (config.requireTempHP && !sourceToken.actor.system.attributes.hp.temp) return;
    if (config.range && (!sourceToken.object || !tokenUtils.isWithinDistance(sourceToken, workflow.token.document, config.range))) return;
    if (!isStrongest(effect, sourceToken.actor)) return;
    const item = effect.transfer && effect.parent?.documentName === 'Item' ? effect.parent : effectUtils.getOriginActivitySync(effect)?.item;
    const activity = item?.system.activities.get(config.rollActivity);
    if (!activity) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(effect), 'CHRISPREMADES.Macros.Generic.ReflectOnHit.NoActivity', {notify: 'warn'});
    if (config.oncePerTurn) {
        const combatData = tokenUtils.getCombatData(sourceToken);
        const stamps = effect.flags['chris-premades']?.reflectOnHit?.stamps ?? [];
        if (combatUtils.isStampedThisTurn(stamps, sourceToken.id, combatData)) return;
        if (combatData.inCombat) await documentUtils.setFlag(effect, 'chris-premades', 'reflectOnHit.stamps', combatUtils.addTurnStamp(stamps, sourceToken.id, combatData));
    }
    const {animation, options} = automationUtils.getResolvedAnimation(effect, 'animation', {source: 'chris-premades', identifier: 'reflectOnHit'});
    animation?.macros?.play?.(sourceToken, workflow.token.document, {...options, damageType: activity.damage?.parts?.[0]?.types?.first(), hit: true});
    await workflowUtils.syntheticActivityRoll(activity, [workflow.token.document], {atLevel: castData?.castLevel || undefined, consumeResources: false, spellSlot: false});
}
/**
 * Rolls an activity against each creature that hits the effect's bearer with an attack, before the attack's damage is
 * applied. The activity comes from the effect's source item, or from the item a transferred effect sits on. A bearer
 * with several same-named effects reflects once, from the one with the highest cast level.
 */
export const reflectOnHit = {
    rules: 'all',
    version: '2.1.9',
    category: 'damage',
    generic: true,
    documents: ['activeeffect'],
    roll: [
        {
            pass: 'targetAttackRollComplete',
            macro: attacked,
            priority: 250,
            canOverlap: true
        }
    ],
    genericConfig: {
        rollActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ReflectOnHit.RollActivity.Hint'
        },
        attackType: attackTypeConfig,
        range: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Generic.ReflectOnHit.Range.Hint'
        },
        requireTempHP: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReflectOnHit.RequireTempHP.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ReflectOnHit.RequireTempHP.Hint'
        },
        oncePerTurn: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReflectOnHit.OncePerTurn.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ReflectOnHit.OncePerTurn.Hint'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'castBeam'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: 'CHRISPREMADES.Macros.Generic.ReflectOnHit.Animation.Hint',
            category: 'animations'
        }
    }
};
const configKeys = Object.keys(reflectOnHit.genericConfig);
