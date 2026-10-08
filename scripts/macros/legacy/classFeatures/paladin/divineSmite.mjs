import {actorUtils, automationUtils, constants, DamageBonus, dialogUtils, documentUtils, workflowUtils} from '../../../../proxy.mjs';
function getFormula(slot, extraDie) {
    return (Math.min(slot.level + 1, 5) + (extraDie ? 1 : 0)) + 'd8';
}
function damage({document, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    const meleeHit = workflowUtils.isAttackType(workflow, 'meleeWeaponAttack');
    const rangedHit = automationUtils.getConfigValue(document, 'allowRanged') && workflowUtils.isAttackType(workflow, 'rangedWeaponAttack');
    if (!meleeHit && !rangedHit) return;
    const unarmed = workflow.item.system.type?.value === 'unarmed' || documentUtils.getIdentifier(workflow.item) === 'unarmed-strike';
    if (unarmed && !automationUtils.getConfigValue(document, 'allowUnarmed')) return;
    const slots = dialogUtils.getSpellSlotOptions(workflow.actor);
    if (!slots.length) return;
    const targetActor = workflow.hitTargets.first().actor;
    const extraDie = !!targetActor && automationUtils.getConfigValue(document, 'creatureTypes').includes(actorUtils.typeOrRace(targetActor));
    let selected = slots[0];
    const bonus = new DamageBonus(document, {formula: getFormula(selected, extraDie), type: automationUtils.getConfigValue(document, 'damageType')})
        .withOnUse(async ({workflow}) => {
            await actorUtils.spendSpellSlots(workflow.actor, selected.value);
            await workflowUtils.completeItemUse(document, Array.from(workflow.hitTargets, token => token.document ?? token), {consumeUsage: false, consumeResources: false});
        });
    if (slots.length === 1) return bonus;
    return bonus.withInputs([['combobox', [{
        name: 'slot',
        label: 'CHRISPREMADES.Macros.Legacy.DivineSmite.Slot',
        options: {
            value: selected.value,
            options: slots,
            onchange: ({input, bonus}) => {
                selected = slots.find(slot => slot.value === input.value) ?? selected;
                bonus.roll = new bonus.rollClass(getFormula(selected, extraDie), bonus.roll.data, bonus.roll.options);
            }
        }
    }]]]);
}
export const divineSmite = {
    name: 'Divine Smite',
    version: '2.0.4',
    rules: '2014',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 250
        }
    ],
    config: {
        damageType: {
            default: 'radiant',
            type: 'select',
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions; }
        },
        creatureTypes: {
            default: ['undead', 'fiend'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            category: 'homebrew',
            get options() { return constants.creatureTypeOptions; }
        },
        allowRanged: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Legacy.DivineSmite.Ranged',
            category: 'homebrew'
        },
        allowUnarmed: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Legacy.DivineSmite.Unarmed',
            category: 'homebrew'
        }
    }
};
