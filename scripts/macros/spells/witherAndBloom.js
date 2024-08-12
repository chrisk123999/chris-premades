import {compendiumUtils, constants, dialogUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let friendlyTargets = workflow.targets.filter(i => i.document.disposition === workflow.token.document.disposition && i.actor.type === 'character');
    if (!friendlyTargets.size) return;
    let selection;
    if (friendlyTargets.size === 1) {
        selection = friendlyTargets.first();
    } else {
        selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.WitherAndBloom.SelectTarget', Array.from(friendlyTargets), {skipDeadAndUnconscious: false});
        if (!selection) return;
        selection = selection[0];
    }
    let ownerId = socketUtils.firstOwner(selection, true);
    let classSelection = await dialogUtils.selectHitDie(selection.actor, workflow.item.name, 'CHRISPREMADES.Macros.WitherAndBloom.SelectHitDie', {userId: ownerId, max: workflow.castData.castLevel - 1});
    if (!classSelection) return;
    let formula = '';
    for (let i of classSelection) {
        formula += i.amount + i.document.system.hitDice + ' + ';
        await genericUtils.update(i.document, {'system.hitDiceUsed': i.document.system.hitDiceUsed + i.amount});
    }
    formula += itemUtils.getMod(workflow.item);
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Wither and Bloom: Heal', {object: true, translate: 'CHRISPREMADES.Macros.WitherAndBloom.Heal'});
    featureData.system.damage.parts[0][0] = formula;
    await workflowUtils.syntheticItemDataRoll(featureData, selection.actor, [selection]);
}
async function damage({trigger, workflow, ditem}) {
    let tokenDocument = await fromUuid(ditem.tokenUuid);
    if (workflow.token.document.disposition != tokenDocument.disposition) return;
    workflowUtils.negateDamageItemDamage(ditem);
}
export let witherAndBloom = {
    name: 'Wither and Bloom',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'applyDamage',
                macro: damage,
                priority: 50
            }
        ]
    }
};