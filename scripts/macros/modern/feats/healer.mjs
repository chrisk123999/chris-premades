import {activityUtils, actorUtils, automationUtils, dialogUtils, queryUtils, rollUtils, workflowUtils} from '../../../proxy.mjs';
async function battleMedic({workflow}) {
    if (workflow.activity.identifier !== 'battle-medic') return;
    const actor = workflow.targets.documents[0]?.actor;
    const selection = actor && await dialogUtils.selectHitDie(actor, workflow.item.name, 'CHRISPREMADES.Macros.Modern.Healer.SelectHitDie', {userId: queryUtils.firstOwner(actor, true), max: 1});
    const {formula} = selection?.length ? await actorUtils.spendHitDice(actor, selection, {roll: false}) : {};
    if (!formula) return workflow.aborted = true;
    await workflowUtils.setActivity(workflow, activityUtils.getDamageModifiedActivityData(workflow.activity, formula + ' + ' + workflow.actor.system.attributes.prof));
}
async function rerolls({document: item, workflow}) {
    if (workflow.activity?.type !== 'heal' || !workflow.damageRolls?.length) return;
    const fromSpell = workflow.item.type === 'spell' && automationUtils.getConfigValue(item, 'spells') !== false;
    if (!fromSpell && workflow.activity.identifier !== 'battle-medic') return;
    const rolls = await Promise.all(workflow.damageRolls.map(roll => {
        const formula = roll.terms.map(term => term instanceof foundry.dice.terms.Die && !term.modifiers.includes('r1') ? term.number + 'd' + term.faces + [...term.modifiers, 'r1'].join('') + (term.flavor ? '[' + term.flavor + ']' : '') : term.formula).join('');
        return rollUtils.damageRoll(formula, workflow.activity, roll.options);
    }));
    await workflow.setDamageRolls(rolls);
}
export const healer = {
    name: 'Healer',
    version: '2.1.7',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: battleMedic,
            priority: 50
        },
        {
            pass: 'actorDamageRoll',
            macro: rerolls,
            priority: 320
        }
    ],
    config: {
        spells: {
            default: true,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Modern.Healer.Spells',
            category: 'homebrew'
        }
    }
};
