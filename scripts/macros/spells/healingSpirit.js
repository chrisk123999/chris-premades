import {Summons} from '../../lib/summons.js';
import {activityUtils, actorUtils, animationUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck() === 'patreon';
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Healing Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let featureDataSummon = await compendiumUtils.getItemFromCompendium(constants.packs.summonFeatures, 'Healing Spirit: Heal', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.HealingSpirit.Heal', identifier: 'healingSpiritHeal'});
    if (!featureDataSummon) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let healId = Object.keys(featureDataSummon.system.activities)[0];
    featureDataSummon.system.activities[healId].healing.custom = {
        enabled: true,
        formula: workflow.castData.castLevel - 1 + 'd6[healing]'
    };
    let uses = Math.max(2, workflow.actor.system.abilities[workflow.item.abilityMod].mod + 1);
    featureDataSummon.system.uses.max = uses;
    let updates = {
        actor: {
            name: workflow.item.name,
            prototypeToken: {
                name: workflow.item.name
            },
            items: [featureDataSummon]
        },
        token: {
            name: workflow.item.name,
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
    if (playAnimation) {
        genericUtils.setProperty(updates, 'token.alpha', 0);
        genericUtils.setProperty(updates, 'token.texture.tint', '#beff5c');
    }
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'healingSpiritMove', {strict: true});
    if (!feature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spawnedTokens = await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 60, 
        range: 60, 
        animation: 'none',
        initiativeType: 'none', 
        additionalVaeButtons: [{type: 'use', name: feature.name, identifier: 'healingSpirit', activityIdentifier: 'healingSpiritMove'}], 
        additionalSummonedVaeButtons: [{type: 'use', name: featureDataSummon.name, identifier: 'healingSpiritHeal'}],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['healingSpiritMove'],
            favorite: true
        }
    });
    if (!spawnedTokens.length) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spawnedToken = spawnedTokens[0];
    if (playAnimation) {
        /* eslint-disable indent */
        //Animations by: eskiemoh
        new Sequence()
            .wait(500)
            .effect()
                .name('Healing Spirit Opening')
                .file('jb2a.energy_strands.in.green.01')
                .atLocation(spawnedToken)
                .scaleToObject(1)
                .fadeIn(500)
                .fadeOut(500)
                .opacity(0.8)
                .filter('ColorMatrix', {'hue': -15})
                .loopProperty('sprite', 'width', {'from': 0, 'to': -0.05, 'duration': 50, 'pingPong': true, 'gridUnits': true, 'ease': 'easeInCubic'})
                .loopProperty('sprite', 'height', {'from': 0, 'to': -0.05, 'duration': 100, 'pingPong': true, 'gridUnits': true, 'ease': 'easeInQuint'})
            .effect()
                .name('Healing Spirit Opening')
                .file('jb2a.markers.02.yellow')
                .atLocation(spawnedToken)
                .scaleToObject(1)
                .fadeIn(1000)
                .fadeOut(500)
                .scaleIn(0, 2500, {'ease': 'easeOutCubic'})
                .filter('ColorMatrix', {'hue': 15, 'saturate': 1})
                .loopProperty('sprite', 'width', {'from': 0, 'to': -0.05, 'duration': 50, 'pingPong': true, 'gridUnits': true, 'ease': 'easeInCubic'})
                .loopProperty('sprite', 'height', {'from': 0, 'to': -0.05, 'duration': 100, 'pingPong': true, 'gridUnits': true, 'ease': 'easeInQuint'})
                .zIndex(0)
            .effect()
                .file('jb2a.butterflies.single.yellow')
                .atLocation(spawnedToken)
                .scaleToObject(1.1, {'considerTokenScale': true})
                .fadeIn(500)
                .zIndex(1)
                .effect()
                .name('Healing Spirit')
                .file('jb2a.energy_field.02.above.green')
                .attachTo(spawnedToken, {'bindVisibility': false, 'bindAlpha': false, 'followRotation': true})
                .scaleToObject(1.2, {'considerTokenScale': true})
                .fadeOut(500)
                .mask(spawnedToken)
                .opacity(1)
                .duration(2000)
                .startTime(3000)
            .effect()
                .file('jb2a.misty_step.02.yellow')
                .atLocation(spawnedToken)
                .scaleToObject(1.5)
                .startTime(1500)
                .filter('ColorMatrix', {'hue': 15})
            .animation()
                .on(spawnedToken)
                .fadeIn(1500)
                .opacity(0.4)
            .effect()
                .file('jb2a.butterflies.many.yellow')
                .attachTo(spawnedToken, {'bindVisibility': false, 'bindAlpha': false, 'followRotation': true})
                .scaleToObject(0.9, {'considerTokenScale': true})
                .fadeIn(500)
                .persist()
                .belowTokens()
                .zIndex(1)
            .effect()
                .file('jb2a.butterflies.few.yellow')
                .attachTo(spawnedToken, {'bindVisibility': false, 'bindAlpha': false, 'followRotation': true})
                .scaleToObject(0.9, {'considerTokenScale': true})
                .fadeIn(500)
                .persist()
                .zIndex(1)
            .effect()
                .file('jb2a.extras.tmfx.outflow.circle.01')
                .attachTo(spawnedToken, {'bindVisibility': false, 'bindAlpha': false, 'followRotation': true})
                .scaleToObject(1.15, {'considerTokenScale': true})
                .persist()
                .opacity(0.2)
                .belowTokens()
                .tint('#a5fe39')
            .effect()
                .name('Healing Spirit')
                .file('jb2a.energy_field.02.above.green')
                .attachTo(spawnedToken, {'bindVisibility': false, 'bindAlpha': false, 'followRotation': true})
                .scaleToObject(1.2, {'considerTokenScale': true})
                .fadeIn(500)
                .repeats(3, 800, 800)
                .mask(spawnedToken)
                .opacity(1)
                .persist()
            .effect()
                .name('Healing Spirit')
                .file(spawnedToken.texture.src)
                .attachTo(spawnedToken, {'bindVisibility': false, 'bindAlpha': false, 'followRotation': true})
                .scaleToObject(1, {'considerTokenScale': true})
                .fadeIn(500)
                .rotate(0)
                .persist()
                .filter('Glow', {'color': 0xa5fe39, 'knockout': true, 'distance': 2.5, 'innerStrength': 0})
                .loopProperty('alphaFilter', 'alpha', {'from': 0.1, 'to': 0.8, 'duration': 1250, 'pingPong': true})
                .waitUntilFinished()
            .effect()
                .file('jb2a.misty_step.02.yellow')
                .atLocation(spawnedToken)
                .scaleToObject(1.5)
                .startTime(1500)
                .filter('ColorMatrix', {'hue': 15})
            .play();
            /* eslint-enable indent */
    }
    let effect = effectUtils.getEffectByIdentifier(spawnedToken.actor, 'summonedEffect');
    if (!effect) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'macros.movement', ['healingSpiritSpirit']);
    await genericUtils.setFlag(effect, 'chris-premades', 'macros.combat', ['healingSpiritSpirit']);
}
async function late({workflow}) {
    if (workflow.item.system.uses.value > 0) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'summonedEffect');
    if (effect) await genericUtils.remove(effect);
}
async function moveOrStart({trigger: {entity: effect, castData, token, target}}) {
    if (combatUtils.inCombat()) {
        let [targetCombatant] = game.combat.getCombatantsByToken(target.document);
        if (!targetCombatant) return;
        if (!combatUtils.perTurnCheck(targetCombatant, 'healingSpirit')) return;
        await combatUtils.setTurnCheck(targetCombatant, 'healingSpirit');
    }
    let feature = itemUtils.getItemByIdentifier(token.actor, 'healingSpiritHeal');
    if (!feature) return;
    let numUses = feature.system.uses.value;
    let selection = await dialogUtils.confirm(target.name, genericUtils.format('CHRISPREMADES.Macros.HealingSpirit.Apply', {numUses}));
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(feature, [target], {config: {consumeUsage: true}});
}
async function early({workflow}) {
    workflowUtils.skipDialog(workflow);
}
export let healingSpirit = {
    name: 'Healing Spirit',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['healingSpirit']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['healingSpiritMove']
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
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.HealingSpirit',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.HealingSpirit',
            type: 'file',
            default: '',
            category: 'summons'
        },
    ]
};
export let healingSpiritHeal = {
    name: 'Healing Spirit: Heal',
    version: healingSpirit.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};
export let healingSpiritSpirit = {
    name: 'Healing Spirit: Spirit',
    version: healingSpirit.version,
    movement: [
        {
            pass: 'movedNear',
            macro: moveOrStart,
            distance: 0,
            priority: 50,
            disposition: 'ally'
        }
    ],
    combat: [
        {
            pass: 'turnStartNear',
            macro: moveOrStart,
            distance: 0,
            priority: 50,
            disposition: 'ally'
        }
    ]
};