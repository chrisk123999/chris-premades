import {automationUtils, documentUtils, rollUtils} from '../../proxy.mjs';
async function use({document: activity, workflow}) {
    if (!workflow.token) return;
    const formula = automationUtils.getGenericConfigValue(activity, 'chris-premades', 'selfDamage', 'formula');
    if (!formula) return;
    const {roll} = await rollUtils.rollDice(formula, {document: activity, workflow, message: true, flavor: activity.name, speaker: ChatMessage.implementation.getSpeaker({token: workflow.token.document})});
    const hp = workflow.actor.system.attributes.hp;
    await documentUtils.update(workflow.actor, {'system.attributes.hp.value': Math.max(0, hp.value - roll.total)});
}
/**
 * The user loses hit points when the activity is used, once its targets are chosen. The loss comes straight off current
 * hit points, so resistances and temporary hit points don't reduce it. Nothing happens when the user has no token.
 */
export const selfDamage = {
    rules: 'all',
    version: '2.1.11',
    category: 'damage',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityPreambleComplete',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        formula: {
            default: '',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula',
            hint: 'CHRISPREMADES.Macros.Generic.SelfDamage.Formula.Hint'
        }
    }
};
