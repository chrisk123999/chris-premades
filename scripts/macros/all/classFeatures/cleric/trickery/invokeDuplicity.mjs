import {activityUtils, actorUtils, dataUtils, dialogUtils, documentUtils, effectUtils, genericUtils, Logging, summonUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function duplicate({document: activity, summon, updates, macroClass: {identifier, source}}) {
    const owner = activity.actor;
    const ownerToken = actorUtils.getFirstToken(owner);
    const name = _loc('CHRISPREMADES.Macros.All.InvokeDuplicity.Name', {name: ownerToken?.name ?? owner.name});
    updates.statuses = ['ethereal'];
    genericUtils.setProperty(updates, 'name', name);
    genericUtils.setProperty(updates, 'prototypeToken.name', name);
    genericUtils.setProperty(updates, 'flags.midi-qol.neverTarget', true);
    genericUtils.setProperty(updates, 'system.traits.size', owner.system.traits.size);
    if (ownerToken) {
        genericUtils.setProperty(updates, 'prototypeToken.width', ownerToken.width);
        genericUtils.setProperty(updates, 'prototypeToken.height', ownerToken.height);
        if (!genericUtils.getProperty(updates, 'prototypeToken.texture.src')) genericUtils.setProperty(updates, 'prototypeToken.texture.src', ownerToken.texture.src);
    }
    const summonEffectData = documentUtils.getEffectByIdentifier(activity.item, 'invokeDuplicitySummoned')?.toObject();
    if (!summonEffectData) return Logging.addMacroWarning(source, identifier, `Invoke Duplicity could not find its summon effect. (activity) ${activity.uuid}`);
    dataUtils.setOrigin(summonEffectData, activity);
    updates.effects.push(summonEffectData);
    if (documentUtils.getRules(activity.item) !== '2024') return;
    const effectData = documentUtils.getEffectByIdentifier(activity.item, 'invokeDuplicitySummoner')?.toObject();
    if (!effectData) return Logging.addMacroWarning(source, identifier, `Invoke Duplicity could not find its parent effect. (activity) ${activity.uuid}`);
    dataUtils.setOrigin(effectData, activity);
    effectData.duration = activityUtils.getEffectDuration(activity);
    const summonerEffect = (await effectUtils.createEffects(activity.actor, [effectData]))?.[0];
    if (!summonerEffect) return Logging.addMacroWarning(source, identifier, `Invoke Duplicity could not create its parent effect. (activity) ${activity.uuid}`);
    summon.parentUuid = summonerEffect.uuid;
}
async function deleted({document, summon}) {
    if (summonUtils.getSummonsBySource(document).some(other => other !== summon)) return;
    const effect = actorUtils.getEffectByIdentifier(document.actor, 'invokeDuplicitySummoner');
    if (effect) await documentUtils.deleteDocument(effect);
}
async function distractedAttack({document: effect, workflow, macroClass: {identifier, source}}) {
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const target = workflow.targets.tokens[0]?.document;
    if (!target) return;
    const token = actorUtils.getFirstToken(effect.actor);
    if (!token) return;
    const origin = await effectUtils.getOriginActivity(effect);
    if (origin?.actor.uuid !== workflow.actor.uuid) return;
    if (!tokenUtils.canSee(target, token))
        return Logging.addMacroWarning(source, identifier, `Invoke Duplicity could not distact a target that cannot see the illusion. (target) ${target.uuid}`);
    if (!tokenUtils.isWithinDistance(token, target, 5) || !tokenUtils.isWithinDistance(workflow.tokenDocument, target, 5))
        return Logging.addMacroWarning(source, identifier, `Invoke Duplicity could not distract a target too far away. (token) ${workflow.tokenDocument.uuid} (illusion) ${token.uuid}`);
    workflow.tracker.advantage.add(identifier, effect.name);
}
async function spell({document: activity}) {
    const summons = summonUtils.getSummonsByIdentifier('cpr-invoke-duplicity', {actor: activity.actor}).filter(s => s.token);
    if (!summons.length) return genericUtils.notify('CAT.Macros.Summon.PlaceSummonFirst', {format: {feature: activity.item.name, activity: activity.name}});
    let summon = summons[0];
    if (summons.length > 1) summon = (await dialogUtils.selectTargetDialog(
        activity.item.name,
        'CHRISPREMADES.Macros.All.InvokeDuplicity.Prompt',
        summons.map(s => s.token),
        {skipDeadAndUnconscious: false}
    ))?.result;
    if (!summon) return;
    const effectData = documentUtils.getBaseEffectData(activity, {
        img: activity.img,
        name: activity.name,
        specialDuration: ['1Spell'],
        identifier: 'invokeDuplicitySpell',
        duration: {value: 1, units: 'seconds'},
        changes: [{key: 'flags.midi-qol.rangeOverride.attack.all', type: 'custom', value: 1}]
    });
    dataUtils.setOrigin(effectData, activity);
    genericUtils.setProperty(effectData, 'flags.dae.expiryMode', 'delete');
    genericUtils.setProperty(effectData, 'flags.dae.stackable', 'noneName');
    const [casterEffect] = await effectUtils.createEffects(activity.actor, [effectData]);
    await effectUtils.createEffects(summon.actor, [effectData], {parentEntity: casterEffect});
}
export const invokeDuplicity = {
    name: 'Invoke Duplicity',
    version: '2.1.9',
    rules: 'all',
    summon: [
        {
            pass: 'preCreate',
            macro: duplicate,
            priority: 50
        },
        {
            pass: 'delete',
            macro: deleted,
            priority: 50
        }
    ]
};
export const invokeDuplicityDistraction = {
    version: invokeDuplicity.version,
    rules: invokeDuplicity.rules,
    roll: [
        {
            pass: 'sceneAttackRollConfig',
            macro: distractedAttack,
            priority: 500,
            canOverlap: true
        }
    ]
};
export const invokeDuplicitySpell = {
    version: invokeDuplicity.version,
    rules: invokeDuplicity.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: spell,
            priority: 500
        }
    ]
};
