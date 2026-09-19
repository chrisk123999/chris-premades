import {actorUtils, dialogUtils, summonUtils, workflowUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'familiar-attack') return;
    if (!workflow.targets.size) return;
    const findFamiliar = actorUtils.getItemByIdentifier(workflow.actor, 'find-familiar');
    const familiarToken = summonUtils.getSummonBySource(findFamiliar)[0]?.token;
    if (!familiarToken || actorUtils.hasUsedReaction(familiarToken.actor)) return;
    const attacks = familiarToken.actor.items.filter(item => item.hasAttack);
    if (!attacks.length) return;
    const selection = attacks.length === 1 ? attacks[0] : await dialogUtils.selectDocumentDialog(document.name, _loc('CHRISPREMADES.Macros.Modern.PactOfTheChain.Attack'), attacks, {sort: 'alphabetical'});
    if (!selection) return;
    await workflowUtils.completeItemUse(selection, Array.from(workflow.targets, token => token.document), {autoDamage: true, fast: true});
    await actorUtils.setReactionUsed(familiarToken.actor);
}
export const pactOfTheChain = {
    name: 'Eldritch Invocations: Pact of the Chain',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ]
};
