import {constants, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflow.activity || !workflow.item) return;
    let baseItem = workflow.item.system.type?.baseItem;
    if (!baseItem) return;
    let weaponType = itemUtils.getConfig(item, 'weaponType');
    if (baseItem != weaponType) return;
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
    },
    config: [
        {
            value: 'weaponType',
            label: 'CHRISPREMADES.Config.WeaponType',
            type: 'select',
            default: 'battleaxe',
            category: 'mechanics',
            options: constants.getBaseMeleeWeaponOptions
        }
    ]
};