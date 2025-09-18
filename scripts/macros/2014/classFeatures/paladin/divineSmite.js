import {actorUtils, constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!itemUtils.getConfig(item, 'allowUnarmed') && constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item))) return;
    let validTypes = ['mwak'];
    if (itemUtils.getConfig(item, 'allowRanged')) {
        validTypes.push('rwak');
    }
    if (!validTypes.includes(workflowUtils.getActionType(workflow))) return;
    if (!actorUtils.hasSpellSlots(workflow.actor)) return;
    let selection = await dialogUtils.selectSpellSlot(workflow.actor, workflow.item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), {no: true});
    if (!selection) return;
    let numDice;
    if (selection === 'pact') {
        await genericUtils.update(workflow.actor, {'system.spells.pact.value': workflow.actor.system.spells.pact.value - 1});
        numDice = Math.min(workflow.actor.system.spells.pact.level + 1, 5);
    } else {
        await genericUtils.update(workflow.actor, {['system.spells.spell' + selection + '.value']: workflow.actor.system.spells['spell' + selection].value - 1});
        numDice = Math.min(Number(selection) + 1, 5);
    }
    let targetActor = workflow.targets.first().actor;
    if (['undead', 'fiend'].includes(actorUtils.typeOrRace(targetActor))) numDice += 1;
    let damageType = itemUtils.getConfig(item, 'damageType');
    let bonusDamageFormula = numDice + 'd8';
    await workflowUtils.bonusDamage(workflow, bonusDamageFormula, {damageType});
    await item.displayCard();
}
export let divineSmite = {
    name: 'Divine Smite',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'radiant',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'allowUnarmed',
            label: 'CHRISPREMADES.Macros.DivineSmite.Unarmed',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'allowRanged',
            label: 'CHRISPREMADES.Macros.DivineSmite.Ranged',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        }
    ]
};