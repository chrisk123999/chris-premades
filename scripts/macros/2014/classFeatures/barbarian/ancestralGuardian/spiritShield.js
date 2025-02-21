import {actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function damage({trigger, workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageRolls || !workflow.item || workflow.defaultDamageType === 'midi-none') return;
    let damageTypes = workflowUtils.getDamageTypes(workflow.damageRolls);
    if (['healing', 'temphp'].find(i => damageTypes.has(i))) return;
    let nearbyTokens = tokenUtils.findNearby(workflow.token, 30, 'enemy').filter(token => {
        if (actorUtils.hasUsedReaction(token.actor)) return;
        let rageEffect = effectUtils.getEffectByIdentifier(token.actor, 'rage');
        if (!rageEffect) return;
        let spiritShield = itemUtils.getItemByIdentifier(token.actor, 'spiritShield');
        if (!spiritShield) return;
        return true;
    });
    if (!nearbyTokens.length) return;
    for (let token of nearbyTokens) {
        let item = itemUtils.getItemByIdentifier(token.actor, 'spiritShield');
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.SpiritShield.Damage', {item: item.name, name: token.document.name}, {userId: socketUtils.firstOwner(token.actor, true)}));
        if (!selection) continue;
        let result = await workflowUtils.syntheticItemRoll(item, [workflow.token], {consumeResources: true, userId: socketUtils.firstOwner(token.actor, true)});
        let total = -result.damageRolls[0].total;
        let value = workflow.damageTotal + total;
        if (value < 0) total -= value;
        await workflowUtils.bonusDamage(workflow, String(total), {damageType: workflow.defaultDamageType, ignoreCrit: true});
        break;
    }
}
export let spiritShield = {
    name: 'Spirit Shield',
    version: '1.2.6',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'sceneDamageRollComplete',
                macro: damage,
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
