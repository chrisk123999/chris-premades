import {Summons} from '../../../../../lib/summons.js';
import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function use({workflow}){
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Spirit Totem');
    if (!sourceActor) return;
    let totemType;
    switch (activityIdentifier) {
        case 'spiritTotemBear':
            totemType = 'bear';
            break;
        case 'spiritTotemHawk':
            totemType = 'hawk';
            break;
        case 'spiritTotemUnicorn':
            totemType = 'unicorn';
            break;
    }
    if (!totemType) return;
    let name = itemUtils.getConfig(workflow.item, totemType + 'Name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.SpiritTotem' + totemType.capitalize());   
    let tokenUpdates = {
        name,
        disposition: workflow.token.document.disposition
    };
    let tokenImg = itemUtils.getConfig(workflow.item, totemType + 'Token') || workflow.activity.img;
    if (tokenImg) {
        genericUtils.setProperty(tokenUpdates, 'texture.src', tokenImg);
    }
    let avatarImg = itemUtils.getConfig(workflow.item, totemType + 'Avatar') || workflow.activity.img;
    let effectData = {
        name: genericUtils.format('CHRISPREMADES.Auras.Source', {auraName: name}),
        img: avatarImg,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity).seconds,
        statuses: ['ethereal'],
        flags: {
            'chris-premades': {
                spiritTotem: {
                    totemType
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'aura', ['spiritTotemAura']);
    let updates = {
        actor: {
            name,
            img: avatarImg,
            prototypeToken: tokenUpdates,
            effects: [effectData]
        },
        token: tokenUpdates
    };
    let animation = itemUtils.getConfig(workflow.item, 'animation') || 'none';
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'spiritTotemMove', {strict: true});
    if (!feature) return;
    let summonedTokens = await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: itemUtils.convertDuration(workflow.activity)?.seconds ?? 60, 
        range: workflow.rangeDetails.range ?? 60, 
        animation, 
        initiativeType: 'none', 
        additionalVaeButtons: [{
            type: 'use', 
            name: feature.name,
            identifier: 'spiritTotem', 
            activityIdentifier: 'spiritTotemMove'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['spiritTotemMove'],
            favorite: true
        }
    });
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'spiritTotem');
    let effectUpdates = {
        flags: {
            'chris-premades': {
                spiritTotem: {
                    totemType
                }
            },
            dae: {
                enableCondition: '!statuses.incapacitated'
            }
        }
    };
    let summonedToken = summonedTokens?.[0];
    switch (activityIdentifier) {
        case 'spiritTotemBear': {
            if (!summonedToken) break;
            let bearSpirit = activityUtils.getActivityByIdentifier(workflow.item, 'bearSpirit', {strict: true});
            if (!bearSpirit) break;
            let nearbyTargets = tokenUtils.findNearby(summonedToken, 30, 'any').filter(i => i.document.disposition === workflow.token.document.disposition);
            if (!nearbyTargets.length) break;
            let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier') || 'druid';
            if (classIdentifier !== 'druid') {
                bearSpirit = activityUtils.withChangedDamage(bearSpirit, '5 + @classes.' + classIdentifier + '.levels');
                await workflowUtils.syntheticActivityDataRoll(bearSpirit, workflow.item, workflow.actor, nearbyTargets);
            } else
                await workflowUtils.syntheticActivityRoll(bearSpirit, nearbyTargets);
            break;
        }
        case 'spiritTotemHawk':
            genericUtils.setProperty(effectUpdates, 'flags.chris-premades.macros.midi.actor', ['spiritTotemAura']);
            break;
        case 'spiritTotemUnicorn':
            genericUtils.setProperty(effectUpdates, 'flags.chris-premades.macros.midi.actor', ['spiritTotemAura']);
            genericUtils.setProperty(effectUpdates, 'flags.chris-premades.macros.check', ['spiritTotemAura']);
            genericUtils.setProperty(effectUpdates, 'flags.chris-premades.macros.skill', ['spiritTotemAura']);
            break;
    }
    await genericUtils.update(effect, effectUpdates);
    if (!summonedToken) return;
    if (!itemUtils.getConfig(workflow.item, 'playAnimation')) return;
    new Sequence()
        .effect()
        .file('jb2a.aura_themed.01.orbit.loop.nature.01.green')
        .size(summonedToken.width + 16, {gridUnits: true})
        .attachTo(summonedToken.object)
        .tieToDocuments(summonedToken)
        .fadeIn(300)
        .fadeOut(300)
        .opacity(0.5)
        .belowTokens()
        .persist()
        .name('spiritTotem')
        .play();
}
async function create({trigger: {entity: effect, target, identifier}}) {
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier);
    if (targetEffect) return;
    let { totemType } = effect.flags['chris-premades'].spiritTotem;
    let effectData = {
        name: effect.name.split(':')[0],
        img: effect.img,
        origin: effect.uuid,
        duration: {
            seconds: effect.duration.remaining
        },
        changes: [],
        flags: {
            'chris-premades': {
                aura: true,
                effect: {
                    noAnimation: true
                }
            },
            dae: {
                showIcon: true
            }
        }
    };
    switch (totemType) {
        case 'bear':
            effectData.changes.push({
                key: 'flags.midi-qol.advantage.check.str',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.save.str',
                mode: 0,
                value: 1,
                priority: 20
            });
            break;
        case 'hawk':
            effectData.changes.push({
                key: 'flags.midi-qol.advantage.skill.prc',
                mode: 0,
                value: 1,
                priority: 20
            });
            break;
        case 'unicorn':
            break;
    }
    return {
        effectData,
        effectOptions: {
            identifier
        }
    };
}
async function sceneAttackRoll({trigger: {entity: effect}, workflow}) {
    if (effect.flags['chris-premades']?.spiritTotem?.totemType !== 'hawk') return;
    if (workflow.advantage) return;
    if (actorUtils.hasUsedReaction(effect.parent)) return;
    let target = actorUtils.getFirstToken(workflow.actor);
    let source = actorUtils.getFirstToken(effect.parent);
    if (target?.document.disposition !== source?.document.disposition) return;
    let totem = canvas.tokens.get(effect.flags['chris-premades']?.summons?.ids[effect.name][0]);
    if (!totem) return;
    if (!workflow.targets.some(t => tokenUtils.getDistance(totem, t) <= 30)) return;
    let feature = itemUtils.getItemByIdentifier(effect.parent, 'spiritTotem');
    if (!feature) return;
    let activity = activityUtils.getActivityByIdentifier(feature, 'hawkSpirit', {strict: true});
    if (!activity) return;
    let userId = socketUtils.firstOwner(effect.parent, true);
    let selection = await dialogUtils.confirm(effect.name, 'CHRISPREMADES.Macros.SpiritTotem.HawkAttack', {userId});
    if (!selection) return;
    workflow.tracker.advantage.add(effect.name, effect.name);
    await workflowUtils.syntheticActivityRoll(activity, []);
    await actorUtils.setReactionUsed(effect.parent);
}
async function late({trigger: {entity: effect}, workflow}) {
    if (effect.flags['chris-premades']?.spiritTotem?.totemType !== 'unicorn') return;
    if (workflow.item.type !== 'spell') return;
    if (!workflow.damageList.some(d => d.newHP > d.oldHP)) return;
    if (!workflow.dnd5eFlags.use?.consumed?.actor?.some(c => c.keyPath.startsWith('system.spells'))) return;
    let feature = itemUtils.getItemByIdentifier(effect.parent, 'spiritTotem');
    if (!feature) return;
    let activity = activityUtils.getActivityByIdentifier(feature, 'unicornSpirit', {strict: true});
    if (!activity) return;
    let totem = canvas.tokens.get(effect.flags['chris-premades']?.summons?.ids[effect.name][0]);
    if (!totem) return;            
    let nearbyTargets = tokenUtils.findNearby(totem, 30, 'any').filter(i => i.document.disposition === workflow.token.document.disposition);
    if (!nearbyTargets.length) return;
    let classIdentifier = itemUtils.getConfig(feature, 'classIdentifier') || 'druid';
    if (classIdentifier !== 'druid') {
        activity = activityUtils.withChangedDamage(activity, '@classes.' + classIdentifier + '.levels');
        await workflowUtils.syntheticActivityDataRoll(activity, feature, workflow.actor, nearbyTargets);
    } else
        await workflowUtils.syntheticActivityRoll(activity, nearbyTargets);
}
async function sceneSituational({trigger: {actor, entity: effect, options, sourceActor, token}}) {
    if (actor.uuid !== effect.parent.uuid) {
        let target = token ?? actorUtils.getFirstToken(sourceActor);
        let source = actorUtils.getFirstToken(actor);
        if (target?.document.disposition !== source?.document.disposition) return;
    }
    let selection = await dialogUtils.confirm(
        effect.name, 
        genericUtils.translate('CHRISPREMADES.Macros.SpiritTotem.UnicornCheck') + 
        '<br>' + 
        genericUtils.translate('CHRISPREMADES.Macros.PotionOfAdvantage.Select'), 
        {userId: socketUtils.gmID()}
    );
    if (!selection) return;
    options.advantage = true;
}
export let spiritTotem = {
    name: 'Spirit Totem',
    version: '1.5.14',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['spiritTotemBear', 'spiritTotemHawk', 'spiritTotemUnicorn']
            }
        ]
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'druid',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'none',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'bearToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritTotemBear',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'hawkToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritTotemHawk',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'unicornToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritTotemUnicorn',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'bearAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritTotemBear',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'hawkAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritTotemHawk',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'unicornAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritTotemUnicorn',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'bearName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritTotemBear',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'hawkName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritTotemHawk',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'unicornName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritTotemUnicorn',
            type: 'text',
            default: '',
            category: 'summons'
        }
    ]
};
export let spiritTotemAura = {
    name: 'Spirit Totem: Aura',
    version: spiritTotem.version,
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 30,
            identifier: 'spiritTotemAura',
            disposition: 'ally'
        }
    ],
    midi: {
        actor: [
            {
                pass: 'scenePreAttackRollConfig',
                macro: sceneAttackRoll,
                priority: 60
            },
            {
                pass: 'preAttackRollConfig',
                macro: sceneAttackRoll,
                priority: 60
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 60
            }
        ]
    },
    skill: [
        {
            pass: 'sceneSituational',
            macro: sceneSituational,
            priority: 50
        },
        {
            pass: 'situational',
            macro: sceneSituational,
            priority: 50
        }
    ],
    check: [
        {
            pass: 'sceneSituational',
            macro: sceneSituational,
            priority: 50
        },
        {
            pass: 'situational',
            macro: sceneSituational,
            priority: 50
        }
    ]
};
