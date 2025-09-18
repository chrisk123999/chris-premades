import {actorUtils, constants, dialogUtils, effectUtils, genericUtils, socketUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function early({trigger: {entity: item, token}, workflow}) {
    if (!workflow.targets.size === 1) return;
    if (workflow.token.document.disposition === token.document.disposition) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (actorUtils.hasUsedReaction(token.actor)) return;
    if (workflow.targets.has(token)) return;
    if (!token.actor.items.some(i => i.system.equipped && i.system.type.value === 'shield')) return;
    if (!tokenUtils.canSee(token, workflow.token)) return;
    let targetToken = workflow.targets.first();
    if (tokenUtils.getDistance(token, targetToken, {wallsBlock: true}) > 5) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.Protection.Protect', {tokenName: targetToken.name}), {userId: socketUtils.firstOwner(item.parent, true)});
    if (!selection) return;
    let targetEffectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.Protection.Protected'),
        img: item.img,
        origin: item.uuid,
        changes: [
            {
                key: 'flags.midi-qol.grants.disadvantage.attack.all',
                mode: 5,
                value: '1',
                priority: 20
            }
        ],
        duration: {
            rounds: 1
        },
        flags: {
            'chris-premades': {
                protection: {
                    protector: token.document.uuid
                }
            }
        }
    };
    let protectorEffectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        duration: {
            rounds: 1
        },
        flags: {
            'chris-premades': {
                protection: {
                    target: targetToken.document.uuid
                }
            },
            dae: {
                specialDuration: [
                    'turnStartSource',
                    'combatEnd'
                ],
                stackable: 'noneNameOnly'
            }
        }
    };
    let protectorEffect = await effectUtils.createEffect(token.actor, protectorEffectData, {
        strictlyInterdependent: true,
        identifier: 'protection',
        rules: 'modern',
        macros: [{type: 'movement', macros: ['protectionMoved']}]
    });
    await effectUtils.createEffect(targetToken.actor, targetEffectData, {
        parentEntity: protectorEffect,
        strictlyInterdependent: true,
        identifier: 'protectionProtected',
        rules: 'modern',
        macros: [{type: 'movement', macros: ['protectionMoved']}]
    });
    await workflowUtils.syntheticItemRoll(item, [targetToken]);
    await actorUtils.setReactionUsed(token.actor);
}
async function moved({trigger: {token, entity: effect}, options}) {
    let targetEffect = effectUtils.getEffectByIdentifier(token.actor, 'protectionProtected');
    let protectorEffect = effectUtils.getEffectByIdentifier(token.actor, 'protection');
    if (targetEffect)
    {
        let protector = fromUuidSync(effect.flags['chris-premades'].protection.protector);
        if (!protector) return;
        if (tokenUtils.getDistance(token, protector, {wallsBlock: true}) > 5)
        {
            await genericUtils.remove(targetEffect);
        }
    }
    else if (protectorEffect)
    {
        let target = fromUuidSync(effect.flags['chris-premades'].protection.target);
        if (!target) return;
        if (tokenUtils.getDistance(token, target, {wallsBlock: true}) > 5)
        {
            await genericUtils.remove(protectorEffect);
        }
    }
}
export let protection = {
    name: 'Protection',
    version: '1.2.36',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'scenePreambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};
export let protectionMoved = {
    name: 'Protection: Moved',
    version: protection.version,
    rules: protection.rules,
    movement: [
        {
            pass: 'moved',
            macro: moved,
            priority: 50
        }
    ]
};