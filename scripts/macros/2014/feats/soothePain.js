import {actorUtils, dialogUtils, genericUtils, socketUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function damageApplication({trigger: {entity: item}, ditem}) {
    await helper(item, ditem);
}
async function sceneDamageApplication({trigger: {token, targetToken, entity: item}, ditem}) {
    await helper(item, ditem, token, targetToken);
}
async function helper(item, ditem, token, targetToken) {
    if (actorUtils.hasUsedReaction(item.actor)) return;
    let uses = item.system.uses.value;
    if (!uses) return;
    let hpDamage = ditem.damageDetail.reduce((acc, i) => acc + ((i.type === 'temphp') ? 0 : i.value), 0) - ditem.oldTempHP;
    if (hpDamage <= 0) return;
    if (token) {
        if (targetToken.document.disposition !== token.document.disposition) return;
        if (tokenUtils.getDistance(token, targetToken) > genericUtils.handleMetric(30)) return;
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.SoothePain.Protect', {tokenName: targetToken.name}), {userId: socketUtils.firstOwner(token.actor, true)});
        if (!selection) return;
    } else {
        let selection = await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.SoothePain.Self', {userId: socketUtils.firstOwner(item.actor, true)});
        if (!selection) return;
    }
    await workflowUtils.completeItemUse(item, {consumeUsage: true}, {configureDialog: false});
    let roll = await new Roll('1d10 + @prof', item.getRollData()).evaluate();
    roll.toMessage({
        speaker: ChatMessage.implementation.getSpeaker({actor: item.actor}),
        flavor: item.name
    });
    let remainingDamage = Math.max(0, hpDamage - roll.total);
    workflowUtils.setDamageItemDamage(ditem, remainingDamage + ditem.oldTempHP, false);
}
export let soothePain = {
    name: 'Righteous Heritor: Soothe Pain',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 50
            },
            {
                pass: 'sceneApplyDamage',
                macro: sceneDamageApplication,
                priority: 50
            }
        ]
    }
};