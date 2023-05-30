import {queue} from '../../../../queue.js';
export async function destructiveWrath({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'destructiveWrath', 351);
    if (!queueSetup) return;
    let oldDamageRoll = workflow.damageRoll;
    if (oldDamageRoll.terms.length === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
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
    queue.remove(workflow.item.uuid);
}