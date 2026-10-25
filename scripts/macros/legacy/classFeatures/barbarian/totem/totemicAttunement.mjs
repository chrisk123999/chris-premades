import {actorUtils, genericUtils, tokenUtils} from '../../../../../proxy.mjs';
async function bear({data, document: item, macroClass: {source}}) {
    data.effectData.system.changes.push({key: `flags.${source}.bear.active`, type: 'override', value: true});
    const macro = {source, rules: meta.rules, identifier: 'bearAttack'};
    genericUtils.setProperty(data.effectData, `flags.${source}.bear.name`, item.name);
    if (data.effectData.flags.cat?.macros?.roll)
        data.effectData.flags.cat.macros.roll.push(macro);
    else 
        genericUtils.setProperty(data.effectData, 'flags.cat.macros.roll', [macro]);
}
async function attack({document: effect, macroClass: {identifier, source}, workflow}) {
    const target = workflow.targets.first()?.document;
    if (workflow.actor.statuses.has('deafened')) return;
    if (!target || target.actor.uuid === effect.actor.uuid) return;
    if (workflow.actor.system.traits.ci.value.has('frightened')) return;
    const self = actorUtils.getFirstToken(effect.actor);
    if (!self || !tokenUtils.canSee(workflow.token.document, self)) return;
    if (target.actor.flags[source]?.bear?.active) return;
    workflow.tracker.disadvantage.add(identifier, effect.flags[source]?.bear?.name ?? effect.name);
}
async function eagle({data}) {
    data.effectData.changes.push({
        key: 'system.attributes.movement.speeds.fly', type: 'upgrade', value: '@attributes.movement.speeds.walk'
    });
}
const meta = {version: '2.1.4', rules: '2014'};
const macro = (name, fn, config) => ({
    name: 'Totemic Attunement: ' + name,
    ...meta,
    called: [{pass: 'actorPreCreateRageEffect', macro: fn, priority: 250}],
    config
});
export const bearAttunement = macro('Bear', bear);
export const bearAttack = {
    ...meta,
    roll: [
        {
            pass: 'nearbyAttackRollConfig',
            macro: attack,
            priority: 500,
            dispositions: ['enemy'],
            distance: 5
        }
    ]
};
export const eagleAttunement = macro('Eagle', eagle);
