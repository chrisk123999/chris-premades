import {automationUtils, effectUtils, workflowUtils} from '../../proxy.mjs';
function attack({document: effect, workflow}) {
    if (!workflow.targets.count || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const sourceActor = effectUtils.getOriginActivitySync(effect)?.actor;
    if (!sourceActor) return;
    const againstSource = workflow.targets.documents.some(token => token.actor?.uuid === sourceActor.uuid);
    const against = automationUtils.getGenericConfigValue(effect, 'chris-premades', 'attackDisadvantage', 'against');
    if (against === 'source' ? !againstSource : againstSource) return;
    workflow.tracker.disadvantage.add('attack-disadvantage', effect.name);
}
/**
 * Gives the creature with this effect disadvantage on attack rolls, either against the effect's source or against
 * anyone else. The source is the actor of the activity that applied the effect. Attacks without targets are ignored.
 */
export const attackDisadvantage = {
    rules: 'all',
    version: '2.1.11',
    category: 'rolls',
    generic: true,
    documents: ['activeeffect'],
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attack,
            priority: 50
        }
    ],
    genericConfig: {
        against: {
            default: 'others',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackDisadvantage.Against.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackDisadvantage.Against.Hint',
            options: [
                {value: 'others', label: 'CHRISPREMADES.Macros.Generic.AttackDisadvantage.Others'},
                {value: 'source', label: 'CHRISPREMADES.Macros.Generic.AttackDisadvantage.Source'}
            ]
        }
    }
};
