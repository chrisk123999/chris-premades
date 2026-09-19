import cprConstants from '../../../../../constants.mjs';
import {actorUtils, automationUtils, compendiumUtils, dialogUtils, genericUtils, itemUtils, queryUtils, summonUtils, workflowUtils} from '../../../../../proxy.mjs';
async function familiar({document, summon, updates}) {
    if (summon.sourceDocument?.identifier !== 'find-familiar') return;
    const movement = await dialogUtils.buttonDialog(document.name, _loc('CHRISPREMADES.Macros.Legacy.InvestmentOfTheChainMaster.Movement'), [
        [CONFIG.DND5E.movementTypes.fly.label, 'fly'],
        [CONFIG.DND5E.movementTypes.swim.label, 'swim']
    ]);
    if (movement) genericUtils.setProperty(updates, 'system.attributes.movement.' + movement, automationUtils.getConfigValue(document, 'speed'));
    const saveDC = itemUtils.getSaveDC(summon.sourceDocument);
    const sourceActor = await summon.getSourceActor();
    updates.items ??= sourceActor.items.map(item => item.toObject());
    updates.items.forEach(itemData => {
        if (itemData.type === 'weapon' && !itemData.system.properties.includes('mgc')) itemData.system.properties.push('mgc');
        Object.values(itemData.system.activities ?? {}).forEach(activityData => {
            if (activityData.type === 'save') genericUtils.setProperty(activityData, 'save.dc', {calculation: '', formula: String(saveDC), value: saveDC});
        });
    });
    const resistance = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.legacy.monsterFeatures, 'investment-of-the-chain-master-resistance', {object: true});
    delete resistance._id;
    updates.items.push(resistance);
    await itemUtils.unhideActivities(document, ['find-familiar-command']);
}
async function hit({document, workflow, sourceToken}) {
    if (!sourceToken || !workflow.hitTargets.has(sourceToken.object)) return;
    const sourceActor = summonUtils.getSummonData(sourceToken.actor)?.owner;
    if (!sourceActor || actorUtils.hasUsedReaction(sourceActor)) return;
    const selection = await dialogUtils.confirmUseItem(document, {userId: queryUtils.firstOwner(sourceActor, true)});
    if (!selection) return;
    await actorUtils.setReactionUsed(sourceActor);
    await workflowUtils.completeItemUse(document, [sourceToken]);
}
export const investmentOfTheChainMaster = {
    name: 'Eldritch Invocations: Investment of the Chain Master',
    version: '2.0.0',
    rules: '2014',
    summon: [
        {pass: 'actorPreCreate', macro: familiar, priority: 50}
    ],
    config: {
        speed: {
            default: 40,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.InvestmentOfTheChainMaster.Speed',
            category: 'homebrew'
        }
    }
};
export const investmentOfTheChainMasterResistance = {
    name: 'Investment of the Chain Master: Familiar Resistance',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'targetDamageRollComplete', macro: hit, priority: 50}
    ]
};
