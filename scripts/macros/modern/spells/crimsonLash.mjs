import constants from '../../../constants.mjs';
import {actorUtils, automationUtils, compendiumUtils, dialogUtils, documentUtils, genericUtils} from '../../../proxy.mjs';
async function use({document, workflow}) {
    const features = constants.sangromancyFeatures.map(identifier => actorUtils.getItemByIdentifier(workflow.actor, identifier)).filter(item => item?.system?.uses?.value);
    const hd = workflow.actor.system.attributes.hd.value;
    if (!hd && !features.length) return;
    const selection = (await dialogUtils.selectHitDie(workflow.actor, workflow.item.name, '', {additionalItems: features}))?.find(i => i.amount);
    if (!selection.amount) return;
    let diceSize;
    if (selection.document.type === 'class') {
        await documentUtils.update(selection.document, {'system.hd.spent': selection.document.system.hd.spent + 1});
        diceSize = selection.document.system.hd.denomination;
    } else {
        await documentUtils.update(selection.document, {'system.uses.spent': selection.document.system.uses.spent + 1});
        diceSize = automationUtils.getConfigValue(selection.document, 'diceSize');
    }
    const match = String(diceSize).toLowerCase().match(/d(\d+)$/);
    if (!match) return;
    const numericDie = Number(match[1]);
    const description = automationUtils.getConfigValue(document, 'description');
    const translation = automationUtils.getConfigValue(document, 'translation');
    const itemData = await compendiumUtils.getDocumentByIdentifier(constants.packs.misc.automationItems, 'crimson-lash-blade', {object: true, description, translation});
    genericUtils.setProperty(itemData, 'system.damage.base.denomination', numericDie);
    const activityId = Object.keys(itemData.system.activities)[0];
    genericUtils.setProperty(itemData, 'system.activities.' + activityId + '.flags.cat.otherAbilities.value', [document.abilityMod]);
    const items = await documentUtils.createEmbeddedDocuments(workflow.actor, 'Item', [itemData]);
    const effect = documentUtils.getEffectByIdentifier(workflow.actor, 'crimsonLashEffect');
    if (!effect) return;
    await documentUtils.makeDependent(effect, items);
}
export const crimsonLash = {
    name: 'Crimson Lash',
    version: '2.0.3',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};