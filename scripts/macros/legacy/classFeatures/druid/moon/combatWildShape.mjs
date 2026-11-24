import {genericUtils} from '../../../../../proxy.mjs';
async function check({workflow}) {
    if (workflow.activity?.identifier !== 'heal' || workflow.actor?.isPolymorphed) return;
    genericUtils.notify('CHRISPREMADES.Macros.Legacy.CombatWildShape.NotTransformed', {type: 'warn'});
    workflow.aborted = true;
    return true;
}
export const combatWildShape = {
    name: 'Combat Wild Shape',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: check,
            priority: 50
        }
    ]
};
