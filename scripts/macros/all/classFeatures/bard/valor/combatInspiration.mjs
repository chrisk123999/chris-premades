import {DamageBonus, genericUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
import {bardicInspiration} from '../bardicInspiration.mjs';
async function modifyInspiration({data, document: item, macroClass: {identifier, source}}) {
    const macro = {rules: combatInspiration.rules, source, identifier: 'combatInspirationEffect'};
    if (data.effectData.flags.cat?.macros.roll)
        data.effectData.flags.cat.macros.roll.push(macro);
    else
        genericUtils.setProperty(data.effectData, 'flags.cat.macros.roll', [macro]);
    const formula = data.effectData.flags[source]?.bardicInspiration;
    if (!formula) return Logging.addMacroWarning(source, identifier, `Combat Inspiration could not find a formula on the bardic inspiration effect! (activity) ${data.activity.uuid}`);
    data.effectData.name = item.name;
    data.effectData.img = item.img;
    // TODO this does not work for modern, still prompts on misses
    // midi needs to check ac bonuses at other reaction phases, currently only uses `reactionattacked`
    const flag = `flags.midi-qol.optional.${identifier}.`;
    data.effectData.system.changes.push(
        {key: flag + 'ac',    type: 'custom', value: formula},
        {key: flag + 'label', type: 'custom', value: item.name}
    );
}
async function damage({document: effect, macroClass: {identifier, source}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    const formula = effect.flags[source]?.bardicInspiration;
    if (!formula) return Logging.addMacroWarning(source, identifier, `Combat Inspiration could not find a formula on the bardic inspiration effect! (effect) ${effect.uuid}`);
    return new DamageBonus(effect, {action: 'special', actor: effect.actor, formula, maxTargets: 1})
        .withOnUse(bardicInspiration.use);
}
export const combatInspiration = {
    name: 'Combat Inspiration',
    version: '2.1.7',
    rules: 'all',
    called: [
        {
            pass: 'actorPreCreateBardicInspiration',
            macro: modifyInspiration,
            priority: 200
        }
    ]
};
export const combatInspirationEffect = {
    version: combatInspiration.version,
    rules: combatInspiration.rules,
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 250
        }
    ]
};
