import {dialogUtils, socketUtils, workflowUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let friendlyTargets = workflow.targets.filter(i => i.document.disposition === workflow.token.document.disposition);
    console.log(friendlyTargets);
    if (!friendlyTargets.size) return;
    let selection;
    if (friendlyTargets.size === 1) {
        selection = friendlyTargets.first();
    } else {
        selection = await dialogUtils.selectTargetDialog('CHRISPREMADES.macros.witherAndBloom.selectTarget.title', 'CHRISPREMADES.macros.witherAndBloom.selectTarget.context', Array.from(friendlyTargets), {skipDeadAndUnconscious: false});
        if (!selection) return;
        selection = selection[0];
    }
    let ownerId = socketUtils.firstOwner(selection, true);
    let classSelection = await dialogUtils.selectHitDie(selection.actor, 'CHRISPREMADES.macros.witherAndBloom.selectHitDie.title', 'CHRISPREMADES.macros.witherAndBloom.selectHitDie.content', {userId: ownerId});
    if (!classSelection) return;
    let classIdentifier = classSelection.radio;


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
                pass: 'RollComplete',
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