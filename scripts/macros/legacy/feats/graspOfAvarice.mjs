import {workflowUtils} from '../../../proxy.mjs';
async function heal({document: item, workflow}) {
    const used = workflowUtils.getWorkflowProperty(workflow, 'damageBonusToOneRoll')?.[item.uuid];
    if (!used || !workflow.token) return;
    const target = fromUuidSync(used.targets[0]);
    const entry = workflow.damageList?.find(entry => entry.actorUuid === target?.actor?.uuid);
    const detail = entry?.damageDetail?.findLast(detail => detail.type === used.type && detail.formula?.trim().replace(/^\+\s*/, '') === used.formula);
    const healing = detail ? detail.value : Math.floor(used.total * (target?.actor ? MidiQOL.getTraitMult(target.actor, used.type, workflow.item) : 1));
    if (healing > 0) await workflowUtils.applyDamage([workflow.token.document], healing, 'healing');
}
export const graspOfAvarice = {
    name: 'Baleful Scion: Grasp of Avarice',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: heal,
            priority: 60
        }
    ]
};
