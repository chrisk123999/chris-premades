import {dialogUtils, documentUtils, effectUtils, rollUtils, tokenUtils} from '../../../../../proxy.mjs';
async function swap({workflow}) {
    const activity = workflow.activity;
    const token = workflow.token?.document;
    const target = workflow.targets.documents[0];
    if (!token || !target || target === token) return;
    await tokenUtils.swapTokens(token, target);
    const amount = rollUtils.getRollsTotal(workflow.utilityRolls ?? []);
    if (!amount) return;
    const recipient = await dialogUtils.buttonDialog(activity.item.name, 'CHRISPREMADES.Macros.Legacy.Maneuvers.BaitSwitchAC', [
        ['CHRISPREMADES.Macros.Legacy.Maneuvers.Self', 'self'],
        [target.name, 'target']
    ]) === 'target' ? target.actor : token.actor;
    const effectData = documentUtils.getBaseEffectData(activity, {
        name: activity.item.name,
        img: activity.item.img,
        origin: activity.uuid,
        duration: {value: 1, units: 'rounds', expiry: 'sourceStart'},
        changes: [{key: 'system.attributes.ac.bonus', type: 'add', value: String(amount), phase: 'initial', priority: 20}]
    });
    await effectUtils.createEffects(recipient, [effectData]);
}
export const baitAndSwitch = {
    name: 'Maneuvers: Bait and Switch',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: swap,
            priority: 50
        }
    ]
};
