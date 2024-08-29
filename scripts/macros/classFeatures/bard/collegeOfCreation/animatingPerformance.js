import {Summons} from '../../../../lib/summons.js';
import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.AnimatingPerformance.Size', [
        ['DND5E.SizeLarge', 'lg'],
        ['DND5E.SizeMedium', 'med'],
        ['DND5E.SizeSmall', 'sm'],
        ['DND5E.SizeTiny', 'tiny']
    ]);
    if (!selection?.length) return;
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Dancing Item');
    if (!sourceActor) return;
    let danceData = await Summons.getSummonItem('Irrepressible Dance', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.AnimatingPerformance.Dance', identifier: 'animatingPerformanceIrrepressibleDance'});
    let immutableFormData = await Summons.getSummonItem('Immutable Form', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.AnimatingPerformance.ImmutableForm', identifier: 'animatingPerformanceImmutableForm'});
    let forceSlamData = await Summons.getSummonItem('Force-Empowered Slam', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.AnimatingPerformance.ForceEmpoweredSlam', identifier: 'animatingPerformanceForceEmpoweredSlam', flatAttack: true});
    let commandData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Animating Performance: Command', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.AnimatingPerformance.Command', identifier: 'animatingPerformanceCommand'});
    let dodgeData = await compendiumUtils.getItemFromCompendium(constants.packs.actions, 'Dodge', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Actions.Dodge', identifier: 'animatingPerformanceDodge'});
    let itemsToAdd = [danceData, immutableFormData, forceSlamData, dodgeData];
    if (!itemsToAdd.every(i => i) || !dodgeData) return;
    let classLevel = workflow.actor.classes?.bard?.system?.levels;
    if (!classLevel) return;
    let hpValue = 10 + 5 * classLevel;
    let heightWidth = 1;
    let scale = 1;
    switch (selection) {
        case 'tiny':
            scale = 0.5;
            break;
        case 'sm':
            scale = 0.8;
            break;
        case 'lg':
            heightWidth = 2;
            break;
    }
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.DancingItem');
    let updates = {
        actor: {
            name,
            system: {
                details: {
                    cr: actorUtils.getCRFromProf(workflow.actor.system.attributes.prof)
                },
                attributes: {
                    hp: {
                        formula: hpValue,
                        max: hpValue,
                        value: hpValue
                    }
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition,
                height: heightWidth,
                width: heightWidth,
                texture: {
                    scaleX: scale,
                    scaleY: scale
                }
            },
            items: itemsToAdd,
            traits: {
                size: selection
            }
        },
        token: {
            name,
            disposition: workflow.token.document.disposition,
            height: heightWidth,
            width: heightWidth,
            texture: {
                scaleX: scale,
                scaleY: scale
            }
        }
    };
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        range: 30,
        duration: 3600,
        animation,
        initiativeType: 'follows',
        additionalVaeButtons: [{type: 'use', name: commandData.name, identifier: 'animatingPerformanceCommand'}],
        additionalSummonVaeButtons:
            itemsToAdd
                .filter(i => ['animatingPerformanceForceEmpoweredSlam', 'animatingPerformanceDodge'].includes(i.flags['chris-premades'].info.identifier))
                .map(i => ({type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier}))
    });
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'animatingPerformance');
    if (!casterEffect) return;
    await itemUtils.createItems(workflow.actor, [commandData], {favorite: true, parentEntity: casterEffect});
}
async function turnStart({trigger: {entity: item, token, target}}) {
    if (token.actor.system.attributes.hp.value === 0 || effectUtils.getEffectByStatusID(token.actor, 'incapacitated')) return;
    let speedDiff = 10 * Math.sign(target.document.disposition * token.document.disposition);
    let effect = await effectUtils.getEffectByIdentifier(target.actor, 'irrepressibleDance');
    if (effect) await genericUtils.remove(effect);
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'system.attributes.movement.walk',
                mode: 2,
                value: speedDiff,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'combatEnd'
                ]
            }
        }
    };
    await effectUtils.createEffect(target.actor, effectData, {identifier: 'irrepressibleDance'});
}
export let animatingPerformance = {
    name: 'Animating Performance',
    version: '0.12.36',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingItem',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingItem',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingItem',
            type: 'file',
            default: '',
            category: 'summons'
        }
        ,{
            value: 'animation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingItem',
            type: 'select',
            default: 'default',
            category: 'animation',
            options: constants.summonAnimationOptions
        }
    ]
};
export let animatingPerformanceDance = {
    name: 'Animating Performance: Irrepressible Dance',
    version: animatingPerformance.version,
    combat: [
        {
            pass: 'turnStartNear',
            macro: turnStart,
            priority: 50,
            distance: 10
        }
    ]
};