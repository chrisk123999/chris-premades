import {compendiumUtils, constants, dialogUtils, effectUtils, workflowUtils} from '../../../utils.js';

async function turnStart({trigger: {entity: item, token}}) {
    let grapplingEffects = effectUtils.getAllEffectsByIdentifier(token.actor, 'grappling');
    let potentialTargets = grapplingEffects.map(i => token.scene.tokens.get(i.flags['chris-premades'].grapple.tokenId)?.object).filter(i => i);
    if (!potentialTargets.length) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Unarmed Fighting: Grapple Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.UnarmedFighting.Grapple'});
    if (!featureData) return;
    let targetToken;
    if (potentialTargets.length > 1) {
        let selected = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.UnarmedFighting.Select', potentialTargets);
        if (selected?.length) targetToken = selected[0];
    }
    if (!targetToken) targetToken = potentialTargets[0];
    await workflowUtils.syntheticItemDataRoll(featureData, token.actor, [targetToken]);
}
async function damage({workflow}) {
    let equippedShields = workflow.actor.items.filter(i => i.system.type?.value === 'shield' && i.system.equipped);
    let equippedWeapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && i !== workflow.item);
    if (!equippedShields.length && !equippedWeapons.length) return;
    await workflowUtils.replaceDamage(workflow, '1d6[bludgeoning] + @abilities.str.mod', {damageType: 'bludgeoning'});
}
export let fightingStyleUnarmedFighting = {
    name: 'Fighting Style: Unarmed Fighting',
    version: '0.12.51',
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    ddbi: {
        removedItems: {
            'Fighting Style: Unarmed Fighting': [
                'Fighting Style: Unarmed Fighting (armed)',
                'Fighting Style: Unarmed Fighting (grapple)'
            ]
        }
    }
};
export let fightingStyleUnarmedFightingUnarmedStrike = {
    name: 'Unarmed Strike (Unarmed Fighting)',
    version: '0.12.51',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 10
            }
        ]
    },
    ddbi: {
        restrictedItems: {
            'Unarmed Strike 2': {
                originalName: 'Unarmed Strike',
                requiredClass: null,
                requiredSubclass: null,
                requiredRace: null,
                requiredEquipment: [],
                requiredFeatures: [
                    'Fighting Style: Unarmed Fighting'
                ],
                replacedItemName: 'Unarmed Strike (Unarmed Fighting)',
                removedItems: [],
                additionalItems: [],
                priority: 0
            }
        }
    }
};