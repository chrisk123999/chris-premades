import {actorUtils, dialogUtils, itemUtils, tokenUtils} from '../../proxy.mjs';
async function pull({workflow, hit}) {
    const label = itemUtils.getMasteryLabel('pull');
    const token = workflow.token.document;
    for (const target of hit) {
        if (!target.object || actorUtils.getSize(target.actor) > CONFIG.DND5E.actorSizes.lg.numerical || tokenUtils.isWithinDistance(token, target, 5)) continue;
        if (!await dialogUtils.confirm(label, _loc('CHRISPREMADES.WeaponMasteries.Pull.Prompt', {target: target.name}))) continue;
        await tokenUtils.slideToken(target, {sourceToken: token, distance: -5});
        if (await dialogUtils.confirm(label, _loc('CHRISPREMADES.WeaponMasteries.Pull.StepBack'))) await tokenUtils.slideToken(token, {sourceToken: target, distance: 5});
    }
}
export const pullMastery = {
    label: 'CHRISPREMADES.WeaponMasteries.Pull.Label',
    macro: pull
};
