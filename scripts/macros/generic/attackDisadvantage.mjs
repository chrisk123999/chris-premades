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
 * Gives the creature with this effect disadvantage on attack rolls, depending on who it attacks.
 * Bound on an effect. Fires on `actorAttackRollConfig`.
 *
 * Config:
 * - `against`: `others` for attacks against anyone except the effect's source, `source` for attacks against the source.
 */
export const attackDisadvantage = {
    rules: 'all',
    version: '2.1.11',
    category: 'mechanics',
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
            label: 'CHRISPREMADES.Macros.Generic.AttackDisadvantage.Against',
            hint: 'CHRISPREMADES.Macros.Generic.AttackDisadvantage.AgainstHint',
            options: [
                {value: 'others', label: 'CHRISPREMADES.Macros.Generic.AttackDisadvantage.Others'},
                {value: 'source', label: 'CHRISPREMADES.Macros.Generic.AttackDisadvantage.Source'}
            ]
        }
    }
};
