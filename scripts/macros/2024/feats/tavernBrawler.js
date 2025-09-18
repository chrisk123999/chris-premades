import {combatUtils, constants, dialogUtils, genericUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function late({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (workflowUtils.getActionType(workflow) !== 'mwak') return;
    if (!constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item))) return;
    if (!combatUtils.perTurnCheck(item, 'tavernBrawler')) return;
    let targetToken = workflow.targets.first();
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseOn', {itemName: item.name, tokenName: targetToken.name}));
    if (!selection) return;
    await combatUtils.setTurnCheck(item, 'tavernBrawler');
    await workflowUtils.completeItemUse(item);
    await tokenUtils.pushToken(workflow.token, targetToken, 5);
}
export let tavernBrawler = {
    name: 'Tavern Brawler',
    version: '1.2.36',
    rules: 'modern',
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
            ],
            'Tavern Brawler: Constitution Score': [
                'Tavern Brawler Strike',
            ]
        }
    }
};
export let tavernBrawlerUnarmedStrike = {
    name: 'Unarmed Strike (Tavern Brawler)',
    version: '1.2.36',
    rules: 'modern',
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