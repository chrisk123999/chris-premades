import {actorUtils, automationUtils, workflowUtils} from '../../../../../proxy.mjs';
import {getSeals} from '../balefulInterdict.mjs';
async function attack({document: item, workflow}) {
    const target = workflow.targets.documents[0];
    const interdict = actorUtils.getItemByIdentifier(item.actor, 'baleful-interdict');
    if (!target?.actor || !interdict || !workflowUtils.isAttackType(workflow, 'attack') || !getSeals(target.actor, interdict).length) return;
    workflowUtils.expandAttackCriticalRange(workflow, automationUtils.getConfigValues(item, ['criticalRange']).criticalRange);
}
export const dispatersInterdictionDispatersSupremacy = {
    name: 'Dispater\'s Interdiction: Dispater\'s Supremacy',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attack,
            priority: 50
        }
    ],
    config: {
        criticalRange: {
            default: 2,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.DispatersSupremacy.CriticalRange',
            category: 'homebrew'
        }
    }
};
