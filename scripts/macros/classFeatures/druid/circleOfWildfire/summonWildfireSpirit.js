import {Summons} from '../../../../lib/summons.js';
import {Teleport} from '../../../../lib/teleport.js';
import {actorUtils, animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Wildfire Spirit');
    if (!sourceActor) return;
    let druidLevel = workflow.actor.classes?.druid?.system?.levels;
    if (!druidLevel) return;
    let flameSeedData = await Summons.getSummonItem('Flame Seed', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonWildfireSpirit.FlameSeed', identifier: 'summonWildfireSpiritFlameSeed', flatAttack: true});
    let fieryTeleportationData = await Summons.getSummonItem('Fiery Teleportation', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonWildfireSpirit.FieryTeleportation', identifier: 'summonWildfireSpiritFieryTeleportation'});
    let fieryTeleportationDamageData = await Summons.getSummonItem('Fiery Teleportation: Damage', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonWildfireSpirit.FieryTeleportationDamage', identifier: 'summonWildfireSpiritFieryTeleportationDamage', flatDC: true});
    let commandData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Wildfire Spirit: Command', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.SummonWildfireSpirit.Command', identifier: 'summonWildfireSpiritCommand'});
    let initialDamageData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Summon Wildfire Spirit: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.SummonWildfireSpirit.Damage', flatDC: itemUtils.getSaveDC(workflow.item)});
    let dodgeData = await compendiumUtils.getItemFromCompendium(constants.packs.actions, 'Dodge', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Actions.Dodge', identifier: 'summonWildfireSpiritDodge'});
    let itemsToAdd = [fieryTeleportationDamageData, flameSeedData, fieryTeleportationData, dodgeData];
    if (!itemsToAdd.every(i => i) || !commandData || !initialDamageData) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (playAnimation) genericUtils.setProperty(fieryTeleportationData, 'flags.chris-premades.config.playAnimation', playAnimation);
    let hpValue = 5 + (druidLevel * 5);
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.WildfireSpirit');
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
                disposition: workflow.token.document.disposition
            },
            items: itemsToAdd
        },
        token: {
            name,
            disposition: workflow.token.document.disposition
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
    let spawnedTokens = await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        range: 30,
        animation,
        initiativeType: 'follows',
        additionalVaeButtons: [{type: 'use', name: commandData.name, identifier: 'summonWildfireSpiritCommand'}],
        additionalSummonVaeButtons: itemsToAdd.slice(1).map(i => ({type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier}))
    });
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'summonWildfireSpirit');
    if (!casterEffect) return;
    await itemUtils.createItems(workflow.actor, [commandData], {favorite: true, parentEntity: casterEffect});
    if (!spawnedTokens?.length) return;
    let [spawnedToken] = spawnedTokens;
    await workflowUtils.syntheticItemDataRoll(initialDamageData, spawnedToken.actor, []);
}
async function teleport({workflow}) {
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'summonWildfireSpiritFieryTeleportationDamage');
    if (!feature) return;
    let allyTargets = tokenUtils.findNearby(workflow.token, 5, 'ally', {includeIncapacitated: true});
    let toTeleport = [workflow.token];
    if (workflow.actor.sheet.rendered) workflow.actor.sheet.minimize();
    if (allyTargets.length) {
        let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Teleport.Select', allyTargets, {skipDeadAndUnconscious: false, type: 'multiple', maxAmount: 99});
        if (selection && selection[0]?.length) {
            toTeleport.push(...selection[0]);
        }
    }
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck() === 'patreon';
    let remainingTargets = tokenUtils.findNearby(workflow.token, 5, null, {includeIncapacitated: true}).filter(i => !toTeleport.includes(i));
    await Teleport.group(toTeleport, workflow.token, {range: 15, animation: playAnimation ? 'thunderStep' : 'none'});
    await workflowUtils.syntheticItemRoll(feature, remainingTargets);
}
export let summonWildfireSpirit = {
    name: 'Summon Wildfire Spirit',
    version: '0.12.44',
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
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.WildfireSpirit',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.WildfireSpirit',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.WildfireSpirit',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.WildfireSpirit',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Macros.SummonWildfireSpirit.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};
export let summonWildfireSpiritTeleport = {
    name: 'Summon Wildfire Spirit: Teleport',
    version: summonWildfireSpirit.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: teleport,
                priority: 50
            }
        ]
    }
};