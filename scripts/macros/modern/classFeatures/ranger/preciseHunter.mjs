import {documentUtils} from '../../../../proxy.mjs';
async function attack({document: item, workflow}) {
    if (workflow.targets.size !== 1) return;
    const targetActor = workflow.targets.first().actor;
    if (!targetActor) return;
    const marked = documentUtils.getEffectByIdentifier(targetActor, 'huntersMarkMarked');
    if (!marked) return;
    if (fromUuidSync(marked.origin)?.actor !== workflow.actor) return;
    workflow.tracker.advantage.add('precise-hunter', item.name);
}
export const preciseHunter = {
    name: 'Precise Hunter',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attack,
            priority: 50
        }
    ]
};
