import {actorUtils, documentUtils, effectUtils, itemUtils, rollUtils, workflowUtils} from '../../../proxy.mjs';
async function undead({document: item, workflow}) {
    if (workflow.activity.identifier !== 'blackrazor' || workflow.hitTargets.size !== 1) return;
    if (actorUtils.typeOrRace(workflow.hitTargets.first().actor) !== 'undead') return;
    await workflow.setDamageRolls([await rollUtils.damageRoll('1d10', workflow.activity, {type: 'healing'})]);
    const backlash = itemUtils.getActivityByIdentifier(item, 'blackrazor-backlash');
    if (backlash) await workflowUtils.syntheticActivityRoll(backlash, [workflow.token.document], {consumeUsage: false, consumeResources: false});
}
async function devour({document: item, workflow}) {
    if (workflow.activity.identifier !== 'blackrazor' || workflow.hitTargets.size !== 1) return;
    const [entry] = workflow.damageList ?? [];
    const target = workflow.hitTargets.first().actor;
    if (!entry || entry.newHP || !entry.oldHP || ['construct', 'undead'].includes(actorUtils.typeOrRace(target))) return;
    const maxHP = target.system.attributes.hp.max;
    await workflowUtils.applyDamage([workflow.token.document], maxHP, 'temphp');
    const sourceEffect = documentUtils.getEffectByIdentifier(item, 'blackrazorDevoured');
    if (!sourceEffect || actorUtils.getEffectByIdentifier(workflow.actor, 'blackrazorDevoured')) return;
    await effectUtils.createEffects(workflow.actor, [documentUtils.getEffectData(item, sourceEffect.id)]);
}
async function faded({document: effect, ditem}) {
    if (!ditem.newTempHP) await documentUtils.deleteDocument(effect);
}
export const blackrazor = {
    name: 'Blackrazor',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'itemDamageRollComplete',
            macro: undead,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: devour,
            priority: 50
        }
    ]
};
export const blackrazorDevoured = {
    name: 'Blackrazor: Devoured',
    version: blackrazor.version,
    rules: blackrazor.rules,
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: faded,
            priority: 50
        }
    ]
};
