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
    if (!workflow.hitTargets.some(token => token.document === sourceToken)) return;
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'reflectOnHit', configKeys);
    if (!workflowUtils.isAttackType(workflow, config.attackType || 'attack')) return;
    if (config.requireTempHP && !sourceToken.actor.system.attributes.hp.temp) return;
    if (config.range && tokenUtils.getDistance(sourceToken, workflow.token.document) > config.range) return;
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
    await workflowUtils.syntheticActivityRoll(activity, [workflow.token.document], {atLevel: castData?.castLevel || undefined, consumeUsage: false, consumeResources: false, spellSlot: false});
}
/**
 * Rolls an activity from the effect's source item, or the item a transferred effect sits on, against each creature that hits the effect's bearer with an attack.
 * Bound on an effect. Fires on `targetAttackRollComplete`, so it runs before the attack's damage is applied.
 * Each hit bearer reflects once, from its same-named effect with the highest cast level.
 *
 * Config:
 * - `rollActivity`: activity on the source item rolled against the attacker, at the level the effect was cast.
 * - `attackType`: only trigger for this attack type. Empty matches any attack.
 * - `range`: only trigger when the attacker is within this distance. 0 ignores distance.
 * - `requireTempHP`: only trigger while the bearer has temporary hit points.
 * - `oncePerTurn`: only trigger once per turn for each bearer. Outside combat it always triggers.
 * - `animation`: played from the bearer to the attacker.
 */
export const reflectOnHit = {
    rules: 'all',
    version: '2.1.3',
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
            label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity',
            hint: 'CHRISPREMADES.Macros.Generic.ReflectOnHit.RollActivityHint'
        },
        attackType: attackTypeConfig,
        range: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Generic.ReflectOnHit.RangeHint'
        },
        requireTempHP: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReflectOnHit.RequireTempHP',
            hint: 'CHRISPREMADES.Macros.Generic.ReflectOnHit.RequireTempHPHint'
        },
        oncePerTurn: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReflectOnHit.OncePerTurn',
            hint: 'CHRISPREMADES.Macros.Generic.ReflectOnHit.OncePerTurnHint'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'castBeam'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
const configKeys = Object.keys(reflectOnHit.genericConfig);
