import {Summons} from '../../lib/summons.js';
import {actorUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Bigby\'s Hand');
    if (!sourceActor) return;
    let damageScale = ((workflow.castData.castLevel - 5) * 2);
    let clenchedFistData = await compendiumUtils.getItemFromCompendium(constants.packs.summonFeatures, 'Clenched Fist', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BigbysHand.Clenched', identifier: 'clenchedFist'});
    let forcefulHandData = await compendiumUtils.getItemFromCompendium(constants.packs.summonFeatures, 'Forceful Hand', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BigbysHand.Forceful', identifier: 'forcefulHand'});
    let graspingHandData = await compendiumUtils.getItemFromCompendium(constants.packs.summonFeatures, 'Grasping Hand', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BigbysHand.Grasping', identifier: 'graspingHand'});
    let interposingHandData = await compendiumUtils.getItemFromCompendium(constants.packs.summonFeatures, 'Interposing Hand', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BigbysHand.Interposing', identifier: 'interposingHand'});
    if (!clenchedFistData || !forcefulHandData || !graspingHandData || !interposingHandData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    clenchedFistData.system.damage.parts = [
        [
            (4 + damageScale) + 'd8[force]',
            'force'
        ]
    ];
    let casterSpellMod = itemUtils.getMod(workflow.item);
    let spellAttackBonus = await new Roll(workflow.actor.system.bonuses.msak.attack + ' +0', workflow.actor.getRollData()).evaluate();
    if (itemUtils.getIdentifer(workflow.item) === 'bigbysBeneficentBracelet') {
        spellAttackBonus = Math.max(spellAttackBonus.total, 13);
    }
    clenchedFistData.system.attack.bonus = '+' + casterSpellMod + ' +' + spellAttackBonus;
    forcefulHandData.name = forcefulHandData.name + ' (' + ((casterSpellMod * 5) + 5) + ' ' + genericUtils.translate('CHRISPREMADES.Units.Feet') + ')';
    effectUtils.addMacro(clenchedFistData, 'midi.item', ['bigbysHandItems']);
    effectUtils.addMacro(forcefulHandData, 'midi.item', ['bigbysHandItems']);
    effectUtils.addMacro(graspingHandData, 'midi.item', ['bigbysHandItems']);
    effectUtils.addMacro(interposingHandData, 'midi.item', ['bigbysHandItems']);
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = 'Bigby\'s Hand';
    let hpFormula = workflow.actor.system.attributes.hp.max;
    let updates = {
        actor: {
            name,
            system: {
                details: {
                    cr: actorUtils.getCRFromProf(workflow.actor.system.attributes.prof)
                },
                attributes: {
                    hp: {
                        formula: hpFormula,
                        max: hpFormula,
                        value: hpFormula
                    }
                }
            },
            prototypeToken: {
                name
            },
            items: [clenchedFistData, forcefulHandData, graspingHandData, interposingHandData],
            flags: {
                'chris-premades': {
                    bigbysHand: {
                        damageScale,
                        casterSpellMod
                    }
                }
            }
        },
        token: {
            name
        }
    };
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'earth';
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Bigby\'s Hand: Move', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BigbysHand.Move', identifier: 'bigbysHandMove'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 60,
        range: 120,
        animation,
        initiativeType: 'none',
        additionalVaeButtons: [{type: 'use', name: featureData.name, identifier: 'bigbysHandMove'}]
    });
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'bigbysHand');
    if (!effect) return;
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures'), parentEntity: effect});
}
async function early({workflow}) {
    let interposingEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'bigbysHandInterposingSource');
    if (interposingEffect) await genericUtils.remove(interposingEffect);
}
async function late({workflow}) {
    let identifier = itemUtils.getIdentifer(workflow.item);
    if (workflow.targets.size !== 1) return;
    let targetActor = workflow.targets.first().actor;
    if (!targetActor) return;
    if (identifier === 'forcefulHand') {
        let hasAdvantage = actorUtils.getSize(targetActor) <= constants.sizes.medium;
        await workflow.actor.rollSkill('ath', {advantage: hasAdvantage});
        await targetActor.rollSkill('ath');
        // TODO: might as well compare the results & do a push in desired direction, no?
    } else if (identifier === 'interposingHand') {
        let effectData = {
            name: workflow.item.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            duration: {
                seconds: 60
            }
        };
        let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'bigbysHandInterposingSource'});
        effectUtils.addMacro(effectData, 'midi.actor', ['bigbysHandItems']);
        await effectUtils.createEffect(targetActor, effectData, {parentEntity: effect, identifier: 'bigbysHandInterposing'});
    } else if (identifier === 'graspingHand') {
        if (actorUtils.getSize(targetActor) > constants.sizes.huge) {
            genericUtils.notify('CHRISPREMADES.Macros.BigbysHand.Big', 'info');
            return;
        }
        let hasAdvantage = actorUtils.getSize(targetActor) <= constants.sizes.medium;
        let sourceRoll = await workflow.actor.rollSkill('ath', {advantage: hasAdvantage});
        let targetRoll;
        if (targetActor.system.skills.acr.total >= targetActor.system.skills.ath.total) {
            targetRoll = await targetActor.rollSkill('acr');
        } else {
            targetRoll = await targetActor.rollSkill('ath');
        }
        if (targetRoll.total > sourceRoll.total) return;
        await effectUtils.applyConditions(targetActor, ['grappled']);
        let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.summonFeatures, 'Grasping Hand: Crush', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BigbysHand.Crush', identifier: 'bigbysHandCrush'});
        if (!featureData) {
            errors.missingPackItem();
            return;
        }
        let {damageScale, casterSpellMod} = workflow.actor.flags['chris-premades'].bigbysHand;
        featureData.system.damage.parts = [
            [
                (2 + damageScale) + 'd6[bludgeoning] + ' + casterSpellMod,
                'bludgeoning'
            ]
        ];
        let effectData = {
            name: featureData.name,
            img: featureData.img,
            origin: workflow.item.uuid,
            duration: {
                seconds: 60
            }
        };
        // TODO: on effect removal, remove grapple from enemy I guess
        let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'bigbysHandCrush', vae: [{type: 'use', name: featureData.name, identifier: 'bigbysHandCrush'}]});
        if (!effect) return;
        await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures'), parentEntity: effect});
    }
}
async function otherEarly({workflow}) {
    // Interposing actor onuse is on someone
    if (workflow.targets.size !== 1 || workflow.disadvantage) return;
    let targetActor = workflow.targets.first().actor;
    // TODO: check target actor is owner of bigbys hand, if so impose half cover
}
async function otherLate({workflow}) {
    // Interposing actor onuse
    if (workflow.targets.size !== 1 || workflow.disadvantage) return;
    let targetACtor = workflow.targets.first().actor;
    // TODO: check target actor is owner of bigbys hand, if so remove half cover
}
export let bigbysHand = {
    name: 'Bigby\'s Hand',
    version: '0.12.5',
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
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BigbysHand',
            type: 'text',
            default: '',
            category: 'summons'
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
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BigbysHand',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BigbysHand',
            type: 'file',
            default: '',
            category: 'summons'
        },
    ]
};
export let bigbysHandItems = {
    name: 'Bigby\'s Hand: Items',
    version: bigbysHand.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            },
            {
                pass: 'preItemRoll',
                macro: early,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'rollFinished',
                macro: otherLate,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: otherEarly,
                priority: 50
            }
        ]
    }
};