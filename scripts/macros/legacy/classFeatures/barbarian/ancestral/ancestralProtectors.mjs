import {constants, effectUtils, genericUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
async function rage({data, document: activity, macroClass: {source}}) {
    genericUtils.setProperty(data.effectData, `flags.${source}.ancestral.activity`, activity.uuid);
    const macro = {source, rules: ancestralProtectors.rules, identifier: 'ancestralProtectorsAttack'};
    if (data.effectData.flags.cat?.macros?.roll)
        data.effectData.flags.cat.macros.roll.push(macro);
    else 
        genericUtils.setProperty(data.effectData, 'flags.cat.macros.roll', [macro]);
}
async function attack({document: effect, macroClass: {identifier, source}, workflow}) {
    const target = workflow.hitTargets.first()?.document;
    if (!target) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const activity = await fromUuid(effect.flags[source]?.ancestral?.activity);
    if (!activity) return Logging.addMacroWarning(source, identifier, `Ancestral Protectors exited early without locating its activity. (rage) ${effect.uuid} (activity) ${effect.flags[source]?.ancestral?.activity}`);
    if (!activity.item.system.uses.value) return Logging.addMacroWarning(source, identifier, `Ancestral Protectors exited early without item uses. (activity) ${activity.uuid}`);
    const effectData = activity.item.effects.contents[0]?.toObject();
    if (!effectData) return Logging.addMacroWarning(source, identifier, `Ancestral Protectors exited early due to a missing active effect. (activity) ${activity.uuid}`);
    genericUtils.setProperty(effectData, 'system.changes.0.value', `targetActorUuid !== '${effect.actor.uuid}'`);
    genericUtils.setProperty(effectData, `flags.${source}.ancestral.source`, effect.actor.uuid);
    await workflowUtils.syntheticActivityRoll(activity, [target]);
    await effectUtils.createEffects(target.actor, [effectData], {parentEntity: effect});
}
async function hinder({document: effect, macroClass: {source}, workflow}) {
    const target = workflow.hitTargets.first()?.actor;
    if (!target || target.uuid === effect.flags[source]?.ancestral?.source) return;
    await effectUtils.createEffects(target, [{
        name: `${effect.name}: ${_loc('DND5E.TRAIT.Damage.Resistance.one')}`,
        img: constants.tempConditionIcon,
        system: {changes: [{key: 'system.traits.dr.all', type: 'custom', value: true}]},
        flags: {
            cat: {noAnimation: true},
            dae: {expiryMode: 'delete', specialDuration: ['isDamaged']}
        }
    }]);
}
export const ancestralProtectors = {
    name: 'Ancestral Protectors',
    version: '2.1.4',
    rules: '2014',
    called: [
        {
            pass: 'actorPreCreateRageEffect',
            macro: rage,
            priority: 250
        }
    ]
};
export const ancestralProtectorsAttack = {
    version: ancestralProtectors.version,
    rules: ancestralProtectors.rules,
    roll: [
        {
            pass: 'actorRollFinished',
            macro: attack,
            priority: 200
        }
    ]
};
export const ancestralProtectorsHinder = {
    version: ancestralProtectors.version,
    rules: ancestralProtectors.rules,
    roll: [
        {
            pass: 'actorDamageRollComplete',
            macro: hinder,
            priority: 200
        }
    ]
};
