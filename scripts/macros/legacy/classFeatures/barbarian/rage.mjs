import {actorUtils, dialogUtils, documentUtils, genericUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
async function setTurn(combatData, rageEffect) {
    await documentUtils.update(rageEffect, {'flags.chris-premades.rage.turn': combatData});
}
async function rageEnd({workflow}) {
    const rageEffect = actorUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (rageEffect) await documentUtils.deleteDocument(rageEffect);
}
async function attack({document: rageEffect, workflow}) {
    const combatData = tokenUtils.getCombatData(workflow.token);
    if (!combatData.inCombat) return;
    if (!workflow.targets.size || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!workflow.targets.some(t => t.document.disposition !== workflow.token.document.disposition)) return;
    await setTurn(combatData, rageEffect);
}
async function isDamaged({ditem, document: rageEffect, targetToken}) {
    if (!ditem.isHit) return;
    const combatData = tokenUtils.getCombatData(targetToken);
    if (!combatData.inCombat) return;
    if (ditem.newHP >= ditem.oldHP) return;
    await setTurn(combatData, rageEffect);
}
async function turnEnd({combatant, document: rageEffect, round}) {
    const turnStamp = genericUtils.getProperty(rageEffect, 'flags.chris-premades.rage.turn');
    if (!turnStamp) return await setTurn(tokenUtils.getCombatData(combatant.token), rageEffect);
    if (round - turnStamp.currentRound < 1) return;
    const rules = documentUtils.getRules(rageEffect) === '2014' ? 'Legacy' : 'Modern';
    const selection = await dialogUtils.confirm(rageEffect.name, _loc(`CHRISPREMADES.Macros.${rules}.Rage.EndEarly`, {actorName: combatant.actor.name}), {userId: queryUtils.gmID()});
    if (!selection) return;
    await documentUtils.deleteDocument(rageEffect);
}
export const endRage = {
    name: 'Rage',
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: rageEnd,
            priority: 50
        }
    ]
};
export const keepRage = {
    name: endRage.name,
    rules: endRage.rules,
    utils: {
        setTurn
    },
    roll: [
        {
            pass: 'actorRollFinished',
            macro: attack,
            priority: 300
        },
        {
            pass: 'targetDamageComplete',
            macro: isDamaged,
            priority: 300
        }
    ],
    combat: [
        {
            pass: 'actorTurnEnd',
            macro: turnEnd,
            priority: 100
        }
    ]
};
