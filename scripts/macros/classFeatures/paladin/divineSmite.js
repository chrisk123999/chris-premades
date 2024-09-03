import {actorUtils, constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let smiteItem = itemUtils.getItemByIdentifier(workflow.actor, 'divineSmite');
    if (!smiteItem) return;
    if (!itemUtils.getConfig(smiteItem, 'allowUnarmed') && constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item))) return;
    let validTypes = ['mwak'];
    if (itemUtils.getConfig(smiteItem, 'allowRanged')) {
        validTypes.push('rwak');
    }
    if (!validTypes.includes(workflow.item.system.actionType)) return;
    if (!actorUtils.hasSpellSlots(workflow.actor)) return;
    let selection = await dialogUtils.selectSpellSlot(workflow.actor, workflow.item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: smiteItem.name}), {no: true});
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
    let damageType = itemUtils.getConfig(smiteItem, 'damageType');
    let bonusDamageFormula = numDice + 'd8[' + damageType + ']';
    await workflowUtils.bonusDamage(workflow, bonusDamageFormula, {damageType});
    await smiteItem.use();
}
export let divineSmite = {
    name: 'Divine Smite',
    version: '0.12.23',
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