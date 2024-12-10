import {actorUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function attacked({trigger, workflow}) {
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    let nearbyToken = tokenUtils.findNearby(trigger.token, 5, 'ally', {includeIncapacitated: true}).filter(i => itemUtils.getItemByIdentifier(i.actor, 'mastersAmulet') && !actorUtils.hasUsedReaction(i.actor)).find(j => itemUtils.getItemByIdentifier(j.actor, 'mastersAmulet').flags['chris-premades']?.mastersAmulet.actorUuid === trigger.token.actor.uuid);
    if (!nearbyToken) return;
    let attackTotal = workflow.attackTotal;
    if (nearbyToken.actor.system.attributes.ac.value > attackTotal) return;
    let selection = await dialogUtils.confirm(trigger.entity.name, genericUtils.format('CHRISPREMADES.Macros.ShieldGuardianShield.Use', {name: nearbyToken.actor.name, attack: attackTotal}), {userId: socketUtils.firstOwner(trigger.token.actor, true)});
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(trigger.entity, [nearbyToken]);
    let effectData = {
        name: trigger.entity.name,
        img: trigger.entity.img,
        duration: {
            seconds: 1
        },
        changes: [
            {
                key: 'system.attributes.ac.bonus',
                mode: 2,
                priority: 20,
                value: '+2'
            }
        ],
        flags: {
            'chris-premades': {
                shieldGuardianShield: {
                    itemId: workflow.item.id
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['shieldGuardianShieldEffect']);
    await effectUtils.createEffect(nearbyToken.actor, effectData, {identifier: 'shieldGuardianShieldEffect'});
}
async function remove({trigger, workflow}) {
    let itemId = trigger.entity.flags['chris-premades']?.shieldGuardianShield?.itemId;
    if (!itemId) return;
    if (workflow.item.id != itemId) return;
    await genericUtils.remove(trigger.entity);
}
export let shieldGuardianShield = {
    name: 'Shield',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'scenePostAttackRoll',
                macro: attacked,
                priority: 50
            }
        ]
    },
    monsters: [
        'Shield Guardian'
    ]
};
export let shieldGuardianShieldEffect = {
    name: shieldGuardianShield.name,
    version: shieldGuardianShield.version,
    midi: {
        actor: [
            {
                pass: 'sceneRollFinished',
                macro: remove,
                priority: 50
            }
        ]
    }
};