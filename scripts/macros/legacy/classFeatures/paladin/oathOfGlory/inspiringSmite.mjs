import {actorUtils, automationUtils, dialogUtils, documentUtils, rollUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function use({workflow, actor, token, item, activity}) {
    const classIdentifier = automationUtils.getConfigValue(item, 'classIdentifier');
    if (!actor.classes[classIdentifier]) return;
    const targets = tokenUtils.findNearby(token, automationUtils.getConfigValue(item, 'range'), {disposition: 'ally', includeToken: true});
    if (!targets.length) return;
    const {roll} = await rollUtils.rollDice('2d8 + @classes.' + classIdentifier + '.levels', {document: activity, message: true, flavor: item.name, manual: true});
    const selection = await dialogUtils.selectTargetDialog(item.name, _loc('CHRISPREMADES.Macros.Legacy.InspiringSmite.Select', {total: roll.total}), targets, {
        type: 'selectAmount',
        maxAmount: roll.total,
        skipDeadAndUnconscious: false
    });
    if (!selection?.result?.length) return;
    for (const {document, value} of selection.result) {
        const amount = Number(value);
        if (amount) await workflowUtils.applyDamage([document], amount, 'temphp');
    }
}
async function offer({document: item, workflow}) {
    if (documentUtils.getIdentifier(workflow.item) !== 'divine-smite') return;
    if (!actorUtils.getItemByIdentifier(workflow.actor, 'channel-divinity')?.system.uses?.value) return;
    const selection = await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Legacy.InspiringSmite.Offer', {item: item.name}));
    if (!selection) return;
    await workflowUtils.completeItemUse(item);
}
export const inspiringSmite = {
    name: 'Channel Divinity: Inspiring Smite',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: offer,
            priority: 250
        }
    ],
    config: {
        classIdentifier: {
            default: 'paladin',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        },
        range: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        }
    }
};
