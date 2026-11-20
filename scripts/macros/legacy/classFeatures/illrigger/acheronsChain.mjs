import {actorUtils, dialogUtils, documentUtils, queryUtils, tokenUtils} from '../../../../proxy.mjs';
const translations = 'CHRISPREMADES.Macros.Legacy.AcheronsChain.';
async function chained({document: item, workflow}) {
    const target = workflow.failedSaves.documents[0];
    if (!target?.actor || !workflow.token) return;
    const source = workflow.token.document;
    const choice = await dialogUtils.buttonDialog(item.name, _loc(translations + 'Choose', {target: target.name}), [[translations + 'Pull', 'pull'], [translations + 'Grapple', 'grapple']], {userId: queryUtils.firstOwner(item.actor, true)});
    if (choice === 'pull') {
        const distance = Math.min(10, Math.floor((tokenUtils.getDistance(source, target) - 4) / 5) * 5);
        if (distance > 0) await tokenUtils.slideToken(target, {sourceToken: source, distance: -distance});
    } else if (choice === 'grapple') {
        await tokenUtils.grapple(source, target, {activity: workflow.activity, contest: false, checkSize: false});
        const grappled = actorUtils.getEffectByIdentifier(target.actor, 'grappleTarget');
        if (grappled) await documentUtils.update(grappled, {duration: {value: 1, units: 'rounds', expiry: 'sourceEnd'}});
    }
}
export const interdictBoonAcheronsChain = {
    name: 'Interdict Boons: Acheron\'s Chain',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: chained,
            priority: 50
        }
    ]
};
