import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, workflowUtils} from '../../../utils.js';

async function turnStart({trigger: {entity: item, token}}) {
    let grapplingEffects = effectUtils.getAllEffectsByIdentifier(token.actor, 'grappling');
    let potentialTargets = grapplingEffects.map(i => token.scene.tokens.get(i.flags['chris-premades'].grapple.tokenId)?.object).filter(i => i);
    if (!potentialTargets.length) return;
    let feature = activityUtils.getActivityByIdentifier(item, 'unarmedFightingDamage', {strict: true});
    if (!feature) return;
    let targetToken;
    if (potentialTargets.length > 1) {
        let selected = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.UnarmedFighting.Select', potentialTargets);
        if (selected?.length) targetToken = selected[0];
    }
    if (!targetToken) targetToken = potentialTargets[0];
    await workflowUtils.syntheticActivityRoll(feature, [targetToken]);
}
async function early({workflow}) {
    let equippedShields = workflow.actor.items.filter(i => i.system.type?.value === 'shield' && i.system.equipped);
    let equippedWeapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && i !== workflow.item);
    if (!equippedShields.length && !equippedWeapons.length) {
        await activityUtils.setDamage(workflow.activity, '1d8[bludgeoning]', ['bludgeoning']);
    } else {
        await activityUtils.setDamage(workflow.activity, '1d6[bludgeoning]', ['bludgeoning']);
    }
}
export let fightingStyleUnarmedFighting = {
    name: 'Fighting Style: Unarmed Fighting',
    version: '1.1.0',
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
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
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
                priority: 10
            }
        }
    }
};