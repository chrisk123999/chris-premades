import {automationUtils, DamageBonus, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
function markedEffectData(activity, document, seconds) {
    return documentUtils.getBaseEffectData(activity, {
        name: _loc('CHRISPREMADES.Macros.Legacy.HuntersMark.Marked'),
        img: document.img,
        origin: document.uuid,
        identifier: 'huntersMarkMarked',
        activityUuid: activity.uuid,
        duration: {seconds}
    });
}
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'hunters-mark') return;
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.targets.size) {
        if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
        return;
    }
    const seconds = workflowUtils.getScaledDuration(workflow);
    const casterEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'huntersMark',
        activityUuid: workflow.activity.uuid,
        duration: {seconds},
        unhideActivities: ['hunters-mark-move'],
        favoriteActivities: true,
        macros: [{type: 'roll', macros: [{source: 'chris-premades', rules: '2014', identifier: 'hunters-mark-attack'}]}]
    });
    genericUtils.setProperty(casterEffectData, 'flags.chris-premades.huntersMark', {
        targets: Array.from(workflow.targets, token => token.document.uuid),
        formula: automationUtils.getConfigValue(document, 'formula')
    });
    const [casterEffect] = await effectUtils.createEffects(workflow.actor, [casterEffectData], {parentEntity: concentrationEffect});
    if (!casterEffect) return;
    for (const target of workflow.targets) {
        await effectUtils.createEffects(target.actor, [markedEffectData(workflow.activity, document, seconds)], {parentEntity: casterEffect});
    }
    if (concentrationEffect) await documentUtils.update(concentrationEffect, {'duration.value': seconds, 'duration.units': 'seconds'});
}
function isValidTarget(token, marked) {
    return !!token && !marked.includes(token.uuid) && (token.actor?.system.attributes.hp.value ?? 0) > 0;
}
async function selectNewTarget(document, token, range, marked, prefix, {userId} = {}) {
    const candidates = tokenUtils.findNearby(token, range, {disposition: 'enemy', includeIncapacitated: false}).filter(candidate => isValidTarget(candidate, marked));
    if (!candidates.length) return genericUtils.notify(prefix + '.NoTargets', {type: 'info'});
    const selection = await dialogUtils.selectTargetDialog(document.name, _loc(prefix + '.MoveSelect'), candidates, {userId});
    return selection?.result;
}
async function move({document, workflow}) {
    if (workflow.activity.identifier !== 'hunters-mark-move') return;
    const casterEffect = documentUtils.getEffectByIdentifier(workflow.actor, 'huntersMark');
    if (!casterEffect) return;
    const markData = casterEffect.flags['chris-premades'].huntersMark;
    const current = markData.targets.map(uuid => fromUuidSync(uuid)).filter(token => token);
    let previous = current[0];
    if (current.length > 1) {
        const selection = await dialogUtils.selectTargetDialog(document.name, _loc('CHRISPREMADES.Macros.Legacy.HuntersMark.Multiple'), current, {skipDeadAndUnconscious: false});
        previous = selection?.result ?? current[0];
    }
    if (previous?.actor) {
        const markedEffect = documentUtils.getEffectByIdentifier(previous.actor, 'huntersMarkMarked');
        if (markedEffect) await documentUtils.deleteDocument(markedEffect);
    }
    let newTarget = workflow.targets.size === 1 ? workflow.targets.first().document : undefined;
    if (!isValidTarget(newTarget, markData.targets)) newTarget = await selectNewTarget(document, workflow.token.document, workflow.activity.range.value, markData.targets, 'CHRISPREMADES.Macros.Legacy.HuntersMark');
    if (!newTarget) return;
    const targets = markData.targets.filter(uuid => uuid !== previous?.uuid);
    targets.push(newTarget.uuid);
    await documentUtils.setFlag(casterEffect, 'chris-premades', 'huntersMark.targets', targets);
    const effectData = markedEffectData(workflow.activity, document, casterEffect.duration.remaining);
    await effectUtils.createEffects(newTarget.actor, [effectData], {parentEntity: casterEffect});
}
async function promptMove({document, token}) {
    if (!automationUtils.getConfigValue(document, 'promptMove')) return;
    const casterEffect = documentUtils.getEffectByIdentifier(document.actor, 'huntersMark');
    if (!casterEffect) return;
    const markedUuids = casterEffect.flags['chris-premades']?.huntersMark?.targets ?? [];
    const marked = markedUuids.map(uuid => fromUuidSync(uuid)).filter(target => target?.actor);
    if (marked.some(target => target.actor.system.attributes.hp.value > 0)) return;
    const activity = itemUtils.getActivityByIdentifier(document, 'hunters-mark-move');
    if (!activity) return;
    const userId = queryUtils.firstOwner(document.actor, true);
    if (!await dialogUtils.confirm(document.name, _loc('CHRISPREMADES.Macros.Legacy.HuntersMark.MovePrompt'), {userId})) return;
    const newTarget = await selectNewTarget(document, token, activity.range.value, markedUuids, 'CHRISPREMADES.Macros.Legacy.HuntersMark', {userId});
    if (!newTarget) return;
    await workflowUtils.completeActivityUse(activity, [newTarget]);
}
async function damage({document, workflow}) {
    if (!workflow.hitTargets.size || !workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    const markData = document.flags['chris-premades']?.huntersMark;
    if (!markData) return;
    const targets = Array.from(workflow.hitTargets, token => token.document).filter(token => markData.targets.includes(token.uuid));
    if (!targets.length) return;
    const bonus = new DamageBonus(document, {formula: markData.formula, optional: false, maxTargets: 1, type: workflow.defaultDamageType});
    bonus.targets = targets;
    return bonus;
}
export const huntersMark = {
    name: 'Hunter\'s Mark',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50},
        {pass: 'itemRollFinished', macro: move, priority: 50}
    ],
    combat: [
        {pass: 'actorTurnStart', macro: promptMove, priority: 50}
    ],
    config: {
        promptMove: {
            default: true,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.PromptMove',
            category: 'mechanics'
        },
        formula: {
            default: '1d6',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        }
    }
};
export const huntersMarkAttack = {
    name: 'Hunter\'s Mark: Attack',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'actorOptionalBonusDamage', phase: 'postResult', macro: damage, priority: 250}
    ]
};
