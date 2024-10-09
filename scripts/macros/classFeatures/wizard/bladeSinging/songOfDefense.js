import {actorUtils, dialogUtils, genericUtils, itemUtils, socketUtils} from '../../../../utils.js';
async function damageApplication({trigger: {token}, ditem}) {
    if (!actorUtils.hasSpellSlots(token.actor)) return;
    if (actorUtils.hasUsedReaction(token.actor)) return;
    let originItem = itemUtils.getItemByIdentifier(token.actor, 'songOfDefense');
    if (!originItem) return;
    let selection = await dialogUtils.selectSpellSlot(token.actor, originItem.name, 'CHRISPREMADES.Macros.SongOfDefense.Select', {no: true, userId: socketUtils.firstOwner(token.actor, true)});
    if (!selection) return;
    let damageReduction;
    if (selection === 'pact') {
        await genericUtils.update(token.actor, {'system.spells.pact.value': token.actor.system.spells.pact.value - 1});
        damageReduction = token.actor.system.spells.pact.level * 5;
    } else {
        let key = 'system.spells.spell' + selection + '.value';
        await genericUtils.update(token.actor, {[key]: token.actor.system.spells['spell' + selection].value - 1});
        damageReduction = selection * 5;
    }
    let totalDone = ditem.damageDetail.reduce((acc, i) => acc + i.value, 0);
    damageReduction = Math.min(totalDone, damageReduction);
    ditem.damageDetail.push({
        value: -damageReduction,
        type: 'none'
    });
    ditem.hpDamage = totalDone - damageReduction;
    await originItem.use();
}
export let songOfDefense = {
    name: 'Song of Defense',
    version: '0.12.62',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 50
            }
        ]
    }
};