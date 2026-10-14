import {automationUtils, combatUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
import {playTargetAnimations} from '../../generic/spellAnimation.mjs';
function getDuelData(effect) {
    return {targets: [], ...effect.flags['chris-premades']?.compelledDuel};
}
function measure(sourceToken, token, position) {
    return token.parent.grid.measurePath([sourceToken.getCenterPoint(), token.getCenterPoint(position)]).distance;
}
async function endSpell(sourceEffect) {
    const concentrationEffect = fromUuidSync(sourceEffect.flags.dnd5e?.dependentOn, {strict: false});
    await documentUtils.deleteDocument(concentrationEffect ?? sourceEffect);
}
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'compelled-duel') return;
    playTargetAnimations(workflow, automationUtils.getResolvedAnimation(document, 'animation'));
    if (!workflow.failedSaves.size) {
        await effectUtils.endConcentration(workflow.actor, workflow.item);
        return;
    }
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'compelledDuelSource');
    const targetEffect = documentUtils.getEffectByIdentifier(document, 'compelledDuelTarget');
    if (!sourceEffect || !targetEffect) return Logging.addMacroWarning('CPR', 'compelled-duel', 'Compelled Duel effects missing from item.', {notify: 'warn'});
    const sourceEffectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {parentEntity: concentrationEffect, activityUuid: workflow.activity.uuid});
    genericUtils.setProperty(sourceEffectData, 'flags.chris-premades.compelledDuel.targets', Array.from(workflow.failedSaves, token => token.document.uuid));
    const [casterEffect] = await effectUtils.createEffects(workflow.actor, [sourceEffectData]);
    if (!casterEffect) return;
    const targetEffectData = documentUtils.getEffectData(workflow.activity, targetEffect.id, {parentEntity: casterEffect, activityUuid: workflow.activity.uuid});
    genericUtils.setProperty(targetEffectData, 'flags.chris-premades.compelledDuel.sourceUuid', workflow.token?.document.uuid);
    await Promise.all(Array.from(workflow.failedSaves, token => effectUtils.createEffects(token.actor, [targetEffectData])));
}
async function sourceRoll({document: effect, workflow}) {
    if (!workflow.token || !workflow.targets.size) return;
    const isAttack = workflowUtils.isAttackType(workflow, 'attack');
    if (!isAttack && workflow.item?.type !== 'spell') return;
    const targetUuids = getDuelData(effect).targets;
    const others = Array.from(workflow.targets).filter(token => !targetUuids.includes(token.document.uuid));
    const broken = isAttack ? others.length : others.some(token => tokenUtils.isEnemy(workflow.token.document, token.document));
    if (!broken) return;
    await endSpell(effect);
}
async function turnEnd({document: effect, token}) {
    const targetTokens = getDuelData(effect).targets.map(uuid => fromUuidSync(uuid, {strict: false})).filter(target => target?.parent === token.parent);
    const maxDistance = automationUtils.getOriginConfigValue(effect, 'maxDistance');
    if (!targetTokens.some(target => tokenUtils.getDistance(token, target) > maxDistance)) return;
    const selection = await dialogUtils.confirm(effect.name, _loc('CHRISPREMADES.Macros.All.CompelledDuel.EndEffect', {distance: maxDistance}), {userId: queryUtils.gmID()});
    if (!selection) return;
    await endSpell(effect);
}
function attack({document: effect, workflow}) {
    if (workflow.targets.size !== 1) return;
    const sourceUuid = getDuelData(effect).sourceUuid;
    if (!sourceUuid || workflow.targets.first().document.uuid === sourceUuid) return;
    workflow.tracker.disadvantage.add('compelled-duel', effect.name);
}
async function moved({document: effect, token, action, teleport}) {
    if (teleport || action === 'catForce') return;
    const origin = {...token.movement.origin};
    const duelData = getDuelData(effect);
    const sourceToken = fromUuidSync(duelData.sourceUuid, {strict: false});
    if (!sourceToken || sourceToken.parent !== token.parent) return;
    if (tokenUtils.getDistance(sourceToken, token) <= automationUtils.getOriginConfigValue(effect, 'maxDistance') || measure(sourceToken, token, origin) >= measure(sourceToken, token)) return;
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    if (!item) return;
    if (documentUtils.getRules(item) === '2014') {
        const combatData = tokenUtils.getCombatData(token);
        const stamps = duelData.stamps ?? [];
        if (combatUtils.isStampedThisTurn(stamps, token.id, combatData)) return;
        const activity = itemUtils.getActivityByIdentifier(item, 'moved');
        if (!activity) return Logging.addMacroWarning('CPR', 'compelled-duel', 'Moved activity missing from item.', {notify: 'warn'});
        const saveWorkflow = await workflowUtils.syntheticActivityRoll(activity, [token], {spellSlot: false});
        if (!saveWorkflow) return;
        if (!saveWorkflow.failedSaves.size) {
            if (combatData.inCombat) await documentUtils.setFlag(effect, 'chris-premades', 'compelledDuel.stamps', combatUtils.addTurnStamp(stamps, token.id, combatData));
            return;
        }
    } else {
        const selection = await dialogUtils.confirm(effect.name, _loc('CHRISPREMADES.Macros.Legacy.BoomingBlade.WillingMove', {actorName: token.name}), {userId: queryUtils.gmID()});
        if (!selection) return;
    }
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'teleportAnimation');
    await tokenUtils.teleportToken(token, {destination: origin, animation, options});
}
async function removed({document: effect}) {
    const sourceEffect = fromUuidSync(effect.flags.dnd5e?.dependentOn, {strict: false});
    if (sourceEffect) await endSpell(sourceEffect);
}
export const compelledDuel = {
    name: 'Compelled Duel',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        maxDistance: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'compelledDuel'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        },
        teleportAnimation: {
            default: {
                source: 'chris-premades',
                identifier: 'mistyStep'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            label: 'CHRISPREMADES.Macros.All.CompelledDuel.TeleportAnimation',
            category: 'animations'
        }
    }
};
export const compelledDuelSource = {
    name: 'Compelled Duel: Source',
    version: compelledDuel.version,
    rules: compelledDuel.rules,
    roll: [
        {
            pass: 'actorRollFinished',
            macro: sourceRoll,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'actorTurnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};
export const compelledDuelTarget = {
    name: 'Compelled Duel: Target',
    version: compelledDuel.version,
    rules: compelledDuel.rules,
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attack,
            priority: 50
        }
    ],
    move: [
        {
            pass: 'actorMoved',
            macro: moved,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: removed,
            priority: 50
        }
    ]
};
