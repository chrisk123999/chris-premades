import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

async function late({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (workflow.item.system.actionType !== 'mwak') return;
    if (workflow.item.system.type !== 'improv' && !constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item))) return;
    if (actorUtils.hasUsedBonusAction(workflow.actor)) return;
    let grapplingEffects = effectUtils.getAllEffectsByIdentifier(workflow.actor, 'grappling');
    if (grapplingEffects.find(i => i.flags['chris-premades'].grapple.tokenId === workflow.targets.first()?.id)) return;
    let selection = await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.TavernBrawler.Use');
    if (!selection) return;
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'grapple');
    if (feature) {
        await workflowUtils.syntheticItemRoll(feature, [workflow.targets.first()]);
    } else {
        let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.actions, 'Grapple', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Actions.Grapple'});
        if (!featureData) {
            errors.missingPackItem();
            return;
        }
        await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [workflow.targets.first()]);
    }
    await actorUtils.setBonusActionUsed(workflow.actor);
}
export let tavernBrawler = {
    name: 'Tavern Brawler',
    version: '0.12.51',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    ddbi: {
        removedItems: {
            'Tavern Brawler: Strength Score': [
                'Tavern Brawler Strike',
                'Tavern Brawler Grapple'
            ],
            'Tavern Brawler: Constitution Score': [
                'Tavern Brawler Strike',
                'Tavern Brawler Grapple'
            ]
        }
    }
};
export let tavernBrawlerUnarmedStrike = {
    name: 'Unarmed Strike (Tavern Brawler)',
    version: '0.12.51',
    ddbi: {
        restrictedItems: {
            'Unarmed Strike 3': {
                originalName: 'Unarmed Strike',
                requiredClass: null,
                requiredSubclass: null,
                requiredRace: null,
                requiredEquipment: [],
                requiredFeatures: [
                    'Tavern Brawler: Constitution Score'
                ],
                replacedItemName: 'Unarmed Strike (Tavern Brawler)',
                removedItems: [],
                additionalItems: [],
                priority: 0
            },
            'Unarmed Strike 4': {
                originalName: 'Unarmed Strike',
                requiredClass: null,
                requiredSubclass: null,
                requiredRace: null,
                requiredEquipment: [],
                requiredFeatures: [
                    'Tavern Brawler: Strength Score'
                ],
                replacedItemName: 'Unarmed Strike (Tavern Brawler)',
                removedItems: [],
                additionalItems: [],
                priority: 0
            }
        }
    }
};