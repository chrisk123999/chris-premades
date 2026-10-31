import {combatUtils, documentUtils, effectUtils, rollUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function jinx({document: item, workflow}) {
    if (workflow.activity.type !== 'attack' || item.system.magicalBonus < 2 || !workflow.token) return;
    const target = workflow.hitTargets.first();
    if (!target?.actor || !workflowUtils.getDamageDealt(workflow, target)) return;
    const token = workflow.token.document;
    const combatData = tokenUtils.getCombatData(token);
    const stamps = workflow.actor.flags['chris-premades']?.grinningSinner ?? [];
    if (combatUtils.isStampedThisTurn(stamps, token.id, combatData)) return;
    if (combatData.inCombat) await documentUtils.setFlag(workflow.actor, 'chris-premades', 'grinningSinner', combatUtils.addTurnStamp(stamps, token.id, combatData));
    const dc = 16 + item.system.magicalBonus;
    const roll = await rollUtils.requestRoll(target.actor, 'save', 'cha', {rollDC: dc});
    if (!roll || roll.total >= dc) return;
    const previous = await fromUuid(workflow.actor.flags['chris-premades']?.grinningSinnerJinx ?? '');
    if (previous) await documentUtils.deleteDocument(previous);
    const penalty = {value: '-1d4', priority: 20, type: 'add'};
    const effectData = documentUtils.getBaseEffectData(item, {
        name: _loc('CHRISPREMADES.Macros.All.GrinningSinner.Jinx'),
        img: item.img,
        origin: item.uuid,
        identifier: 'grinningSinnerJinx',
        duration: {value: 1, units: 'minutes'},
        changes: ['abilities.check', 'abilities.save', 'mwak.attack', 'rwak.attack', 'msak.attack', 'rsak.attack'].map(key => ({key: 'system.bonuses.' + key, ...penalty}))
    });
    const [effect] = await effectUtils.createEffects(target.actor, [effectData]);
    if (effect) await documentUtils.setFlag(workflow.actor, 'chris-premades', 'grinningSinnerJinx', effect.uuid);
}
export const grinningSinner = {
    name: 'Blunderbuss of the Grinning Sinner',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: jinx,
            priority: 50
        }
    ]
};
