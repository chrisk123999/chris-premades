import {DialogApp} from '../../../applications/dialog.js';
import {combatUtils, constants, genericUtils, workflowUtils} from '../../../utils.js';
async function damageReroll({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1 || !workflow.damageRoll || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('piercing')) return;
    if (!combatUtils.perTurnCheck(item, 'piercer')) return;
    let newDamageRolls = workflow.damageRolls;
    let lowest = [];
    for (let a = 0; a < newDamageRolls.length; a++) {
        let newDamageRoll = newDamageRolls[a];
        for (let term = 0; term < newDamageRoll.terms.length; term++) {
            if (newDamageRoll.terms[term].isDeterministic === false) {
                let currentTerm = newDamageRoll.terms[term];
                let modifiers = currentTerm.modifiers?.toString();
                let flavor = currentTerm.flavor?.length ? currentTerm.flavor : newDamageRoll.options.type;
                let expression = currentTerm.expression;
                let results = [];
                for (let position = 0; position < currentTerm.values.length; position++) {
                    results.push(currentTerm.values[position]);
                }
                lowest.push({
                    roll: a,
                    results,
                    expression,
                    faces: currentTerm.faces,
                    term,
                    modifiers,
                    flavor
                });
            }
        }
    }
    let selection = await DialogApp.dialog(item.name, 'CHRISPREMADES.Macros.Piercer.Reroll', [[
        'checkbox',
        lowest.map(i => ({
            label: i.expression + (i.flavor ? '[' + i.flavor + ']: ' : ': ') + Math.min(...i.results),
            name: i.roll + '-' + i.term
        })),
        {displayAsRows: true, totalMax: 1}
    ]], 'yesNo');
    if (!selection?.buttons) return;
    let toReroll = Object.keys(selection).find(i => i !== 'buttons' && selection[i]);
    if (!toReroll) return;
    await combatUtils.setTurnCheck(item, 'piercer');
    let [roll, term] = toReroll.split('-');
    let existingRoll = lowest.find(i => i.roll == roll && i.term == term);
    let worstInd;
    for (let i = 1; i <= existingRoll.faces; i++) {
        for (let j = 0; j < existingRoll.results.length; j++) {
            if (existingRoll.results[j] == i) worstInd = j;
            if (worstInd !== undefined) break;
        }
        if (worstInd !== undefined) break;
    }
    let damageFormula = '1d' + existingRoll.faces + existingRoll.modifiers + (existingRoll.flavor?.length ? '[' + existingRoll.flavor + ']' : '');
    let newRoll = await new Roll(damageFormula, existingRoll.data).evaluate();
    await newRoll.toMessage({
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: genericUtils.format('CHRISPREMADES.Generic.Rerolling', {origDie: 'd' + existingRoll.faces, origResult: existingRoll.results[worstInd]}),
        rollMode: game.settings.get('core', 'rollMode')
    });
    newDamageRolls[roll].terms[term].results[worstInd].result = newRoll.total;
    await workflow.setDamageRolls(newDamageRolls);
}
async function damageCrit({trigger: {entity: item}, workflow}) {
    if (!workflow.isCritical) return;
    if (workflow.hitTargets.size !== 1 || !workflow.damageRoll || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('piercing')) return;
    let piercingRolls = workflow.damageRolls.filter(i => i.options.type === 'piercing');
    if (!piercingRolls.length) return;
    let bestDie = Math.max(...piercingRolls.map(i => i.terms.reduce((acc, term) => {
        if (term?.faces > acc) return term.faces;
        return acc;
    }, 0)));
    let bonusDamage = '1d' + bestDie + '[piercing]';
    await workflowUtils.bonusDamage(workflow, bonusDamage, {ignoreCrit: true, damageType: 'piercing'});
    await item.displayCard();
}
async function combatEnd({trigger: {entity: item}}) {
    await combatUtils.setTurnCheck(item, 'piercer', true);
}
export let piercer = {
    name: 'Piercer',
    version: '1.1.42',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damageReroll,
                priority: 350
            },
            {
                pass: 'damageRollComplete',
                macro: damageCrit,
                priority: 51
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ]
};