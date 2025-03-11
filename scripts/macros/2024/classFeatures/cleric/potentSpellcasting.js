import {constants, itemUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.item?.type != 'spell' || !workflow.castData) return;
    if (workflowUtils.getCastLevel(workflow) != 0) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    if (workflow.item.system.sourceClass != classIdentifier) return;
    let ability = itemUtils.getConfig(item, 'ability');
    let modifier = workflow.actor.system.abilities[ability].mod;
    await workflowUtils.bonusDamage(workflow, modifier, {damageType: workflow.defaultDamageType});
    await item.displayCard();
}
export let potentSpellcasting = {
    name: 'Blessed Strikes: Potent Spellcasting',
    version: '1.2.12',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            }
        ]
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'cleric',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'ability',
            label: 'CHRISPREMADES.Config.Ability',
            type: 'select',
            options: constants.abilityOptions,
            default: 'wis',
            category: 'homebrew',
            homebrew: true
        }
    ]
};