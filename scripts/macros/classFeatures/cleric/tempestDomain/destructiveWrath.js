export async function destructiveWrath(workflow) {
    let oldDamageRoll = workflow.damageRoll;
    if (oldDamageRoll.terms.length === 0) return;
    let newDamageRoll = '';
    for (let i = 0; oldDamageRoll.terms.length > i; i++) {
        let flavor = oldDamageRoll.terms[i].flavor;
        let isDeterministic = oldDamageRoll.terms[i].isDeterministic;
        if (!(flavor.toLowerCase() === 'lightning' || flavor.toLowerCase() === 'thunder') || isDeterministic === true) {
            newDamageRoll += oldDamageRoll.terms[i].formula;
        } else {
            newDamageRoll += '(' + oldDamageRoll.terms[i].number + '*' + oldDamageRoll.terms[i].faces + ')[' + flavor + ']';
        }
    }
    let damageRoll = await new Roll(newDamageRoll).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
}