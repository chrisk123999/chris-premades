import {actorUtils, combatUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function turnStart({trigger: {entity: item, token}}) {
    let config = itemUtils.getGenericFeatureConfig(item, 'genericRegeneration');
    let actor = item.actor;
    let hp = actor.system.attributes.hp.value;
    if (token.combatant?.isDefeated) return;
    if (config.zeroHP && !hp) return;
    if (actorUtils.checkTrait(actor, 'di', 'healing')) return;
    let blockedEffect = effectUtils.getEffectByIdentifier(actor, 'regenerationBlocked');
    if (blockedEffect) {
        if (hp) await genericUtils.remove(blockedEffect);
        return;
    }
    let reducedEffect = effectUtils.getEffectByIdentifier(actor, 'regenerationReduced');
    let featureData = genericUtils.duplicate(item.toObject());
    if (reducedEffect) {
        featureData.system.damage.parts[0][0] = '(' + featureData.system.damage.parts[0][0] + ') / 2';
        await genericUtils.remove(reducedEffect);
    }
    let deadEffect = effectUtils.getEffectByIdentifier(actor, 'falseDead');
    if (deadEffect) await genericUtils.remove(deadEffect);
    await workflowUtils.syntheticItemDataRoll(featureData, actor, [token]);
}
async function onHit({trigger: {entity: item, token}, workflow}) {
    let config = itemUtils.getGenericFeatureConfig(item, 'genericRegeneration');
    let actor = item.actor;
    let blockedEffect = effectUtils.getEffectByIdentifier(actor, 'regenerationBlocked');
    if (blockedEffect) return;
    let reducedEffect = effectUtils.getEffectByIdentifier(actor, 'regenerationReduced');
    let hp = actor.system.attributes.hp.value;
    let ditem = workflow.damageList.find(i => i.actorUuid === actor.uuid);
    let damageTypes = config.damageTypes;
    let threshold = config.threshold;
    let block = false;
    let reduce = false;
    let showIcon = config.showIcons;
    for (let damageType of damageTypes) {
        if (!ditem.damageDetail.find(i => i.type === damageType)) continue;
        if (threshold) {
            if (ditem.oldHP) {
                // Not at 0hp, so doesn't matter, only reduce
                reduce = true;
                break;
            } else {
                // At 0hp - if deal threshold, dead (block forever)
                if (ditem.damageDetail.reduce((acc, i) => acc + (i.type === damageType ? i.value : 0), 0) >= threshold) {
                    reduce = false;
                    block = true;
                    break;
                }
                reduce = true;
                continue;
            }
        }
        reduce = false;
        block = true;
        break;
    }
    if (workflow.isCritical && config.critical) block = true;
    if (!block) {
        if (reduce && !reducedEffect) {
            let effectData = {
                name: genericUtils.translate('CHRISPREMADES.Macros.Regeneration.Reduced'),
                img: item.img,
                origin: item.uuid,
                flags: {
                    dae: {
                        showIcon
                    }
                }
            };
            await effectUtils.createEffect(actor, effectData, {identifier: 'regenerationReduced'});
        }
        if (config.zeroHP) return;
        if (!hp && combatUtils.inCombat()) {
            let updates = {
                defeated: false
            };
            let combatant = game.combat.combatants.find(i => i.tokenId === token.id);
            if (!combatant) return;
            await genericUtils.update(combatant, updates);
            let effect = effectUtils.getEffectByIdentifier(actor, 'falseDead');
            if (!effect) {
                let effectData = {
                    name: genericUtils.translate('CHRISPREMADES.Macros.Regeneration.Dead'),
                    img: CONFIG.DND5E.statusEffects.dead.icon,
                    origin: item.uuid,
                    changes: [
                        {
                            key: 'system.traits.ci.value',
                            mode: 2,
                            value: 'dead',
                            priority: 20
                        }
                    ],
                    flags: {
                        'chris-premades': {
                            conditions: ['prone'],
                            effect: {
                                noAnimation: true
                            }
                        },
                        dae: {
                            showIcon: true
                        },
                        core: {
                            overlay: true
                        }
                    }
                };
                await effectUtils.createEffect(actor, effectData, {identifier: 'falseDead'});
            }
        }
    } else {
        if (reducedEffect) await genericUtils.remove(reducedEffect);
        if (!hp && combatUtils.inCombat()) {
            let effect = effectUtils.getEffectByIdentifier(actor, 'falseDead');
            if (effect) await genericUtils.remove(effect);
        }
        let effectData = {
            name: genericUtils.translate('CHRISPREMADES.Macros.Regeneration.Blocked'),
            img: item.img,
            origin: item.uuid,
            flags: {
                dae: {
                    showIcon
                }
            }
        };
        await effectUtils.createEffect(actor, effectData, {identifier: 'regenerationBlocked'});
    }
}
export let genericRegeneration = {
    name: 'Regeneration',
    version: '0.12.82',
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: onHit,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Macros.Regeneration.DamageTypes',
            type: 'damageTypes',
            default: ['acid', 'fire']
        },
        {
            value: 'threshold',
            label: 'CHRISPREMADES.Macros.Regeneration.Threshold',
            type: 'number',
            default: 0
        },
        {
            value: 'zeroHP',
            label: 'CHRISPREMADES.Macros.Regeneration.ZeroHP',
            type: 'checkbox',
            default: false
        },
        {
            value: 'critical',
            label: 'CHRISPREMADES.Macros.Regeneration.Critical',
            type: 'checkbox',
            default: false
        },
        {
            value: 'showIcons',
            label: 'CHRISPREMADES.Macros.Regeneration.ShowIcons',
            type: 'checkbox',
            default: false
        }
    ]
};