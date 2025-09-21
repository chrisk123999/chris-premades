import {constants, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger, workflow}) {
    if (!workflow.activity || !constants.meleeWeaponTypes.includes(workflow.item?.system?.type?.value)) return;
    await workflowUtils.swapAttackAbility(workflow, 'cha');
}
export let combatMasteryLies = {
    name: 'Combat Mastery: Lies',
    version: '1.3.66',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 25
            }
        ]
    }
};