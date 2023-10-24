import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.item.type != 'weapon') return;
    let effect = chris.findEffect(workflow.actor, 'Rage');
    if (!effect) return;
    let divineEffect = chris.findEffect(workflow.actor, 'Divine Fury');
    if (!divineEffect) return;
    let originItem = await fromUuid(divineEffect.origin);
    if (!originItem) return;
    let classLevels = workflow.actor.classes.barbarian?.system?.levels;
    if (!classLevels) return;
    let barbDamage = Math.floor(classLevels / 2);
    let damageType = workflow.actor.flags['chris-premades']?.feature?.divineFury?.damageType;
    if (!damageType) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'divineFury', 250);
    if (!queueSetup) return;
    let doExtraDamage = chris.perTurnCheck(originItem, 'feature', 'divineFury', true, workflow.token.id);
    if (!doExtraDamage) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await chris.setTurnCheck(originItem, 'feature', 'divineFury');
    let bonusDamage = '1d6[' + damageType + '] + ' + barbDamage;
    if (workflow.isCritical) bonusDamage = chris.getCriticalFormula(bonusDamage);
    let damageFormula = workflow.damageRoll._formula + ' + ' + bonusDamage;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function end(origin) {
    await chris.setTurnCheck(origin, 'feature', 'divineFury', true);
}
export let divineFury = {
    'attack': attack,
    'end': end
}