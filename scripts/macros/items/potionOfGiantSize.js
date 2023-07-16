import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let effect = chris.findEffect(targetActor, 'Potion of Giant Size');
    if (!effect) return;
    let changes = effect.changes;
    changes[3].value = targetActor.system.attributes.hp.max * 2;
    let updates = {changes};
    await chris.updateEffect(effect, updates);
    await chris.applyDamage(targetToken, targetActor.system.attributes.hp.value, 'healing');
}
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.item.type != 'weapon') return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'potionOfGiantSize', 375);
    if (!queueSetup) return;
    let bonusDamageNumber = workflow.damageRoll.terms[0].number * 3 - workflow.damageRoll.terms[0].number;
    let bonusDamageDice = workflow.damageRoll.terms[0].faces;
    let flavor = workflow.damageRoll.terms[0].options.flavor;
    let bonusDamageFormula = ' + ' + bonusDamageNumber + 'd' + bonusDamageDice + '[' + flavor + ']';
    let damageFormula = workflow.damageRoll._formula + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function end(token, actor) {
    let hpValue = actor.system.attributes.hp.value;
    let hpMax = actor.system.attributes.hp.max;
    let hpTemp = hpValue - hpMax;
    if (hpValue <= hpMax) return;
    let updates = {
        'system.attributes.hp.value': hpMax
    };
    await actor.update(updates);
    await chris.applyDamage(token, hpTemp, 'temphp');
}
export let potionOfGiantSize = {
    'item': item,
    'damage': damage,
    'end': end
}