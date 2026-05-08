import {actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function early({workflow}) {
    if (workflow.targets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    let targetToken = workflow.targets.first();
    if (effectUtils.getEffectByIdentifier(targetToken.actor, 'protectionProtected')) return;
    let nearbyTokens = tokenUtils.findNearby(targetToken, 5, 'ally').filter(t => {
        if (workflow.token.document.disposition === t.document.disposition) return;
        if (!t.actor.system.attributes.ac.equippedShield) return;
        if (actorUtils.hasUsedReaction(t.actor)) return;
        if (workflow.targets.has(t)) return;
        if (!tokenUtils.canSee(t, workflow.token)) return;
        let protection = itemUtils.getItemByIdentifier(t.actor, 'protection');
        if (!protection) return;
        genericUtils.setProperty(t, 'chris-premades.protection', protection);
        return true;
    });
    if (!nearbyTokens.length) return;
    for (let t of nearbyTokens) {
        let protection = genericUtils.getProperty(t, 'chris-premades.protection');
        let selection = await dialogUtils.confirm(protection.name, genericUtils.format('CHRISPREMADES.Macros.Protection.Protect', {tokenName: targetToken.name}), {userId: socketUtils.firstOwner(t.actor, true)});
        if (!selection) continue;
        let targetEffectData = {
            name: genericUtils.translate('CHRISPREMADES.Macros.Protection.Protected'),
            img: protection.img,
            origin: protection.uuid,
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
                        protector: t.document.uuid
                    }
                }
            }
        };
        let protectorEffectData = {
            name: protection.name,
            img: protection.img,
            origin: protection.uuid,
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
        let protectorEffect = await effectUtils.createEffect(t.actor, protectorEffectData, {
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
        await workflowUtils.syntheticItemRoll(protection, [targetToken]);
        await actorUtils.setReactionUsed(t.actor);
        break;
    }
}
async function moved({trigger: {token, entity: effect}, options}) {
    let targetEffect = effectUtils.getEffectByIdentifier(token.actor, 'protectionProtected');
    let protectorEffect = effectUtils.getEffectByIdentifier(token.actor, 'protection');
    if (targetEffect)
    {
        let protector = fromUuidSync(effect.flags['chris-premades'].protection.protector);
        if (!protector) return;
        if (tokenUtils.getDistance(token, protector, {wallsBlock: true}) > genericUtils.convertDistance(5))
        {
            await genericUtils.remove(targetEffect);
        }
    }
    else if (protectorEffect)
    {
        let target = fromUuidSync(effect.flags['chris-premades'].protection.target);
        if (!target) return;
        if (tokenUtils.getDistance(token, target, {wallsBlock: true}) > genericUtils.convertDistance(5))
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