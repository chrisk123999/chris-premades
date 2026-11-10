import cprConstants from '../../../../../constants.mjs';
import {automationUtils, compendiumUtils, dialogUtils, Logging, queryUtils, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
import utils from '../../../../../utils.mjs';
async function weave({document, workflow}) {
    if (workflow.activity.identifier !== 'weave-wicker-tokens') return;
    await utils.deleteCharms(workflow.actor, 'wickerToken');
    const quantity = rollUtils.rollDiceSync(automationUtils.getConfigValue(document, 'quantity'), {document}).total;
    if (quantity < 1) return;
    const itemData = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.misc.automationItems, 'wicker-token-charm', {object: true, translate: 'CHRISPREMADES.Macros.Modern.WickerToken.Token'});
    if (!itemData) return Logging.addMacroWarning('CPR', 'wicker-token', 'Wicker Token missing from the automation items compendium.', {notify: 'warn'});
    const druidToken = workflow.token?.document ?? workflow.token;
    const candidates = new Map();
    const onScene = new Set([workflow.actor]);
    for (const token of druidToken?.parent?.tokens ?? []) {
        if (!token.actor || token === druidToken) continue;
        candidates.set(token.id, {token, actor: token.actor});
        onScene.add(token.actor);
    }
    if (automationUtils.getConfigValue(document, 'partyMembers')) {
        const offScene = (game.actors.party?.system.creatures ?? []).filter(actor => !onScene.has(actor));
        const tokens = await Promise.all(offScene.map(actor => actor.getTokenDocument({_id: actor.id})));
        offScene.forEach((actor, index) => candidates.set(actor.id, {token: tokens[index], actor}));
    }
    const userId = queryUtils.firstOwner(workflow.actor, true);
    const selected = candidates.size ? await dialogUtils.selectTargetDialog(workflow.item.name, _loc('CHRISPREMADES.Macros.Modern.WickerToken.Give', {quantity}), [...candidates.values()].map(candidate => candidate.token), {type: 'multiple', maxAmount: quantity, skipDeadAndUnconscious: false, userId}) : null;
    const recipients = (selected?.result ?? []).map(token => candidates.get(token.id).actor);
    const remaining = quantity - recipients.length;
    await Promise.all([
        ...recipients.map(recipient => utils.createCharms(recipient, [{...itemData, system: {...itemData.system, quantity: 1}}], {key: 'wickerToken', source: workflow.actor})),
        remaining > 0 && utils.createCharms(workflow.actor, [{...itemData, system: {...itemData.system, quantity: remaining}}], {key: 'wickerToken', source: workflow.actor})
    ]);
}
async function touch({activity, actor, token, config}) {
    if (activity.item.type !== 'spell' || activity.range.units !== 'touch' || !token?.object) return;
    const targets = workflowUtils.getPreTargetingTargets(config).map(target => target.object).filter(target => target?.actor && target !== token.object);
    const outOfRange = targets.filter(target => MidiQOL.checkActivityRange(activity, token.object, [target], false).result === 'fail');
    if (!outOfRange.length || !outOfRange.every(target => utils.carriesCharm(target.actor, actor, ['wickerToken']))) return;
    if (activity.item !== actor.items.get(activity.item.id)) activity.item.updateSource({'system.range.units': 'any'});
}
export const wickerToken = {
    name: 'Wicker Token',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'actorPreTargeting',
            macro: touch,
            priority: 10
        },
        {
            pass: 'itemRollFinished',
            macro: weave,
            priority: 50
        }
    ],
    config: {
        quantity: {
            default: '@prof',
            type: 'formula',
            label: 'CHRISPREMADES.Macros.Modern.WickerToken.Quantity',
            category: 'homebrew'
        },
        partyMembers: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Modern.WickerToken.PartyMembers',
            hint: 'CHRISPREMADES.Macros.Modern.WickerToken.PartyMembersHint',
            category: 'homebrew'
        }
    }
};
