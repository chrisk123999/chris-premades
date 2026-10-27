import cprConstants from '../../../../../constants.mjs';
import utils from '../../../../../utils.mjs';
import {activityUtils, automationUtils, compendiumUtils, Logging, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function weave({document, workflow}) {
    if (workflow.activity.identifier !== 'weave-wicker-tokens') return;
    await utils.deleteCharms(workflow.actor, 'wickerToken');
    const quantity = rollUtils.rollDiceSync(automationUtils.getConfigValue(document, 'quantity'), {document}).total;
    if (quantity < 1) return;
    const itemData = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.misc.automationItems, 'wicker-token-charm', {object: true, translate: 'CHRISPREMADES.Macros.Modern.WickerToken.Token'});
    if (!itemData) return Logging.addMacroWarning('CPR', 'wicker-token', 'Wicker Token missing from the automation items compendium.', {notify: 'warn'});
    itemData.system.quantity = quantity;
    await utils.createCharms(workflow.actor, [itemData], {key: 'wickerToken', source: workflow.actor});
}
function touch({activity, actor, token, config}) {
    activityUtils.overrideNextUse(activity, null);
    if (activity.item.type !== 'spell' || activity.range.units !== 'touch' || !token?.object) return;
    const targets = workflowUtils.getPreTargetingTargets(config).map(target => target.object).filter(target => target?.actor && target !== token.object);
    const outOfRange = targets.filter(target => MidiQOL.checkActivityRange(activity, token.object, [target], false).result === 'fail');
    if (!outOfRange.length || !outOfRange.every(target => utils.carriesCharm(target.actor, actor, ['wickerToken']))) return;
    activityUtils.overrideNextUse(activity, {'range.override': true, 'range.units': 'any'});
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
            type: 'text',
            label: 'CHRISPREMADES.Macros.Modern.WickerToken.Quantity',
            category: 'homebrew'
        }
    }
};
