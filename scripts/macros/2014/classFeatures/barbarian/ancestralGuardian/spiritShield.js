import {activityUtils, actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function shieldHelper(token, sourceToken, targetToken, ditem) {
    if (actorUtils.hasUsedReaction(token.actor)) return;
    let rageEffect = effectUtils.getEffectByIdentifier(token.actor, 'rage');
    if (!rageEffect) return;
    let spiritShield = itemUtils.getItemByIdentifier(token.actor, 'spiritShield');
    if (!spiritShield) return;
    let selection = await dialogUtils.confirm(spiritShield.name, genericUtils.format('CHRISPREMADES.Macros.SpiritShield.Damage', {item: spiritShield.name, name: targetToken.document.name}), {userId: socketUtils.firstOwner(token.actor, true)});
    if (!selection) return;
    let result = await workflowUtils.syntheticItemRoll(spiritShield, [token], {consumeResources: true, userId: socketUtils.firstOwner(token.actor, true)});
    workflowUtils.modifyDamageAppliedFlat(ditem, -result.damageRolls[0].total);
    let vengefulAncestors = itemUtils.getItemByIdentifier(token.actor, 'vengefulAncestors');
    if (vengefulAncestors) {
        let activity = activityUtils.getActivityByIdentifier(vengefulAncestors, 'use', {strict: true});
        if (!activity) return true;
        let featureData = genericUtils.duplicate(vengefulAncestors.toObject());
        featureData.system.activities[activity.id].damage.parts[0].bonus = result.damageRolls[0].total;
        await workflowUtils.syntheticItemDataRoll(featureData, token.actor, [sourceToken]);
    }
    return true;
}
async function damageApplication({trigger: {sourceToken, targetToken}, ditem}) {
    let nearbyTokens = tokenUtils.findNearby(targetToken, 30, 'ally', {includeIncapacitated: false, includeToken: true});
    for (let i of nearbyTokens) {
        let shielded = await shieldHelper(i, sourceToken, targetToken, ditem);
        if (shielded) break;
    }
}
export let spiritShield = {
    name: 'Spirit Shield',
    version: '1.2.30',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'sceneApplyDamage',
                macro: damageApplication,
                priority: 250
            }
        ]
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'barbarian',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'spirit-shield',
            category: 'homebrew',
            homebrew: true
        },
    ],
    scales: [
        {
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'spirit-shield',
                    type: 'dice',
                    scale: {
                        6: {
                            number: 2,
                            faces: 6,
                            modifiers: []
                        },
                        10: {
                            number: 3,
                            faces: 6,
                            modifiers: []
                        },
                        14: {
                            number: 4,
                            faces: 6,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Spirit Shield',
                icon: null
            }
        }
    ]
};
