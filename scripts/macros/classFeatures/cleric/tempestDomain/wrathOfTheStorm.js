import {chris} from '../../../../helperFunctions.js';
export async function wrathOfTheStorm(workflow) {
    let selection = await chris.dialog('What damage type?', [['Lightning', '[lightning]'], ['Thunder', '[thunder]']]);
    if (!selection) selection = 'lightning';
    let damageFormula = workflow.damageRoll._formula + selection;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
}