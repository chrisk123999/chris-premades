import {documentUtils, effectUtils, workflowUtils} from '../../../../proxy.mjs';
async function addActivities({data, document: item}) {
    data.activities.push(...item.system.activities.contents);
}
async function attackBonus({document: effect, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const origin = await effectUtils.getOriginActivity(effect);
    if (!origin?.actor) return;
    if (origin.actor.id === workflow.actor.id) return;
    const bonus = effect.parent.flags['chris-premades']?.sunderingBlow ?? 5;
    await workflowUtils.bonusAttack(workflow, bonus);
    await documentUtils.deleteDocument(effect);
}
export const improvedBrutalStrike = {
    name: 'Improved Brutal Strike',
    version: '2.0.2',
    rules: '2024',
    called: [
        {
            pass: 'actorBrutalStrike',
            macro: addActivities,
            priority: 200
        }
    ]
};
export const sunderingBlow = {
    name: 'Sundering Blow',
    version: improvedBrutalStrike.version,
    rules: improvedBrutalStrike.rules,
    roll: [
        {
            pass: 'targetAttackRoll',
            macro: attackBonus,
            priority: 300
        }
    ]
};
