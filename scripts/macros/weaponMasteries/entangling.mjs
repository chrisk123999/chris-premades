import {actorUtils, documentUtils, genericUtils, itemUtils, rollUtils, tokenUtils} from '../../proxy.mjs';
async function hit({workflow, hit}) {
    const target = hit[0];
    if (!target || actorUtils.getSize(target.actor) >= CONFIG.DND5E.actorSizes.huge.numerical) return;
    if (!await actorUtils.confirmBonusAction(workflow.actor, itemUtils.getMasteryLabel('entangling'), _loc('CHRISPREMADES.WeaponMasteries.Entangling.Prompt', {target: target.name}))) return;
    const dc = 10 + workflow.actor.system.attributes.prof;
    const roll = await rollUtils.requestRoll(target.actor, 'save', 'dex', {rollDC: dc});
    if (!roll || roll.total >= dc) return;
    const token = workflow.token.document;
    await tokenUtils.grapple(token, target.document, {flatDC: dc, rules: '2024', contest: false, checkSize: false});
    const effect = actorUtils.getEffectByIdentifier(workflow.actor, 'grappleSource', {multiple: true}).find(effect => effect.flags.cat?.grapple?.tokenId === target.document.id);
    if (effect) await documentUtils.setFlag(effect, 'chris-premades', 'entangling', workflow.item.uuid);
}
function preItemRoll({document: item, workflow}) {
    const effect = actorUtils.getEffectByIdentifier(workflow.actor, 'grappleSource', {multiple: true}).find(effect => effect.flags['chris-premades']?.entangling === item.uuid);
    if (!effect) return;
    const grappled = effect.flags.cat?.grapple?.tokenId;
    if (Array.from(workflow.targets).every(token => token.document.id === grappled)) return;
    genericUtils.notify('CHRISPREMADES.WeaponMasteries.Entangling.Restricted', {type: 'warn'});
    return true;
}
export const entanglingMastery = {
    label: 'CHRISPREMADES.WeaponMasteries.Entangling.Label',
    macro: hit,
    roll: [
        {pass: 'itemPreItemRoll', macro: preItemRoll, priority: 50}
    ]
};
