import cprConstants from '../../../../../constants.mjs';
import utils from '../../../../../utils.mjs';
import {automationUtils, compendiumUtils, constants, documentUtils, itemUtils, Logging, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
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
async function touch({document, activity, actor, token, config}) {
    if (activity.item.type !== 'spell' || activity.range.units !== 'touch' || !token?.object) return;
    const targets = workflowUtils.getPreTargetingTargets(config).map(target => target.object).filter(target => target?.actor && target !== token.object);
    const outOfRange = targets.filter(target => MidiQOL.checkActivityRange(activity, token.object, [target], false).result === 'fail');
    if (!outOfRange.length || !outOfRange.every(target => utils.carriesCharm(target.actor, actor, ['wickerToken']))) return;
    const effectData = documentUtils.getBaseEffectData(document, {
        name: document.name,
        img: constants.tempConditionIcon,
        origin: document.uuid,
        changes: [
            {key: 'system.activities.' + activity.id + '.range.override', type: 'override', value: true, priority: 20},
            {key: 'system.activities.' + activity.id + '.range.units', type: 'override', value: 'any', priority: 20}
        ],
        specialDuration: ['endOfWorkflow']
    });
    await itemUtils.enchantItem(actor.items.get(activity.item.id), effectData);
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
