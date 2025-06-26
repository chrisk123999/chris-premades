import {Summons} from '../../../lib/summons.js';
import {animationUtils, combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Guardian of Faith');
    if (!sourceActor) return;
    let featureDataSummon = await compendiumUtils.getItemFromCompendium(constants.packs.summonFeatures, 'Guardian of Faith: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.GuardianOfFaith.Damage', identifier: 'guardianOfFaithDamage', flatDC: itemUtils.getSaveDC(workflow.item)});
    if (!featureDataSummon) {
        errors.missingPackItem();
        return;
    }
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    Object.values(featureDataSummon.system.activities).forEach(activity =>
        activity.damage?.parts.forEach(part => 
            part.types = [damageType]
        )
    );
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = sourceActor.name;
    let updates = {
        actor: {
            name,
            prototypeToken: {
                name
            },
            items: [featureDataSummon]
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
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'celestial';
    let spawnedTokens = await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 28800,
        range: 30,
        animation,
        initiativeType: 'none'
    });
    if (!spawnedTokens?.length) return;
    let spawnedToken = spawnedTokens[0];
    let effect = effectUtils.getEffectByIdentifier(spawnedToken.actor, 'summonedEffect');
    if (!effect) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'macros.movement', ['guardianOfFaithDamage']);
    await genericUtils.setFlag(effect, 'chris-premades', 'macros.combat', ['guardianOfFaithDamage']);
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck();
    if (!playAnimation) return;
    let color = itemUtils.getConfig(workflow.item, 'color') ?? 'yellow';
    new Sequence()
        .effect()
        .file('jb2a.bless.400px.loop.' + color)
        .size(spawnedToken.width + 6, {gridUnits: true})
        .attachTo(spawnedToken)
        .persist()
        .name('GuardianOfFaith-' + spawnedToken.id)
        .fadeIn(300)
        .fadeOut(300)
        .play();
}
async function moveOrStart({trigger: {entity: effect, token, target}}) {
    if (combatUtils.inCombat()) {
        let [targetCombatant] = game.combat.getCombatantsByToken(target.document);
        if (!targetCombatant) return;
        if (!combatUtils.perTurnCheck(targetCombatant, 'guardianOfFaith')) return;
        await combatUtils.setTurnCheck(targetCombatant, 'guardianOfFaith');
    }
    let feature = itemUtils.getItemByIdentifier(token.actor, 'guardianOfFaithDamage');
    if (!feature) return;
    let attackWorkflow = await workflowUtils.syntheticItemRoll(feature, [target]);
    let appliedDamage = Math.floor(attackWorkflow.damageList[0].damageDetail.reduce((acc, i) => acc + i.value, 0));
    if (!appliedDamage) return;
    await genericUtils.update(feature, {'system.uses.spent': feature.system.uses.spent + appliedDamage});
    if (feature.system.uses.value > 0) return;
    Sequencer.EffectManager.endEffects({name: 'GuardionOfFaith-' + token.id});
    await genericUtils.remove(effect);
}
export let guardianOfFaith = {
    name: 'Guardian of Faith',
    version: '1.1.0',
    hasAnimation: true,
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
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.GuardianOfFaith',
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
            value: 'color',
            label: 'CHRISPREMADES.Config.Color',
            type: 'select',
            default: 'yellow',
            category: 'animation',
            options: [
                {
                    value: 'yellow',
                    label: 'CHRISPREMADES.Config.Colors.Yellow'
                },
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.GuardianOfFaith',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.GuardianOfFaith',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'radiant',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let guardianOfFaithDamage = {
    name: 'Guardian of Faith: Damage',
    version: guardianOfFaith.version,
    movement: [
        {
            pass: 'movedNear',
            macro: moveOrStart,
            distance: 10,
            priority: 50,
            disposition: 'enemy'
        }
    ],
    combat: [
        {
            pass: 'turnStartNear',
            macro: moveOrStart,
            distance: 10,
            priority: 50,
            disposition: 'enemy'
        }
    ]
};