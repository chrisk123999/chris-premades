import {Summons} from '../../../lib/summons.js';
import {activityUtils, actorUtils, combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.modernPacks.summons, 'CPR - Spectral Animals');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflowUtils.getCastLevel(workflow);
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = sourceActor.name;
    let updates = {
        actor: {
            name,
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            }
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
    let [spawnedToken=null] = await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: itemUtils.convertDuration(workflow.item).seconds,
        range: workflow.item.system.range.value,
        animation,
        initiativeType: 'follows'
    });
    if (!spawnedToken) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'conjureAnimals');
    let summonedEffect = effectUtils.getEffectByIdentifier(spawnedToken.actor, 'summonedEffect');
    if (!casterEffect || !summonedEffect) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await genericUtils.update(casterEffect, {'flags.chris-premades.macros.save': ['conjureAnimalsActive']});
    await genericUtils.update(summonedEffect, {
        'flags.chris-premades': {
            macros: {
                combat: ['conjureAnimalsActive'],
                movement: ['conjureAnimalsActive']
            },
            'conjureAnimals.touchedTokenIds': {},
            castData: {
                baseLevel: workflow.castData.baseLevel,
                castLevel: spellLevel,
                saveDC: itemUtils.getSaveDC(workflow.item)
            }
        }
    });
    let nearbyTargets = tokenUtils.findNearby(spawnedToken, 10, 'enemy');
    let turnToCheck;
    if (combatUtils.inCombat()) turnToCheck = combatUtils.currentTurn();
    await saveHelper(nearbyTargets, summonedEffect, spawnedToken.object, turnToCheck);
}
async function save({trigger: {entity: effect, token, saveId, options}}) {
    if (saveId !== 'str') return;
    if (!token) return;
    let summonToken = canvas?.scene?.tokens.get(effect.flags['chris-premades']?.summons?.ids[effect.name][0]);
    if (!summonToken) return;
    if (tokenUtils.getDistance(token, summonToken, {wallsBlock: true}) > 5) return;
    options.advantage = true;
}
async function moved({trigger: {token, entity: effect}, options}) {
    let startPoint = genericUtils.duplicate(options._movement[token.id].origin);
    let offset = token.document.width * canvas.grid.size / 2;
    startPoint.x += offset;
    startPoint.y += offset;
    let endPoint = {x: token.center.x, y: token.center.y};
    let radius = 10 + token.document.width * canvas.grid.distance;
    let affectedTokens = tokenUtils.getMovementHitTokens(startPoint, endPoint, radius, {includeAlreadyHit: true});
    affectedTokens = Array.from(affectedTokens).filter(t => t.actor && !MidiQOL.checkIncapacitated(t.actor) && token.document.disposition !== t.document.disposition);
    let turnToCheck;
    if (combatUtils.inCombat()) turnToCheck = combatUtils.currentTurn();
    await saveHelper(affectedTokens, effect, token, turnToCheck);
}
async function turnEnd({trigger: {token, target, entity: effect, previousTurn, previousRound}}) {
    let turnToCheck = previousRound + '-' + previousTurn;
    await saveHelper([target], effect, token, turnToCheck);
}
async function movedNear({trigger: {token, target, entity: effect}}) {
    let turnToCheck;
    if (combatUtils.inCombat()) turnToCheck = combatUtils.currentTurn();
    await saveHelper([target], effect, token, turnToCheck);
}
async function saveHelper(affectedTokens, effect, token, turnToCheck) {
    let allEffects = canvas.tokens.placeables
        .filter(i => i.document.disposition === token.document.disposition)
        .map(i => effectUtils.getEffectByIdentifier(i.actor, 'summonedEffect'))
        .filter(i => i?.flags['chris-premades']?.conjureAnimals);
    if (turnToCheck) {
        affectedTokens = affectedTokens.filter(target => {
            return !allEffects.find(i => i.flags['chris-premades'].conjureAnimals.touchedTokenIds[turnToCheck]?.includes(target.id));
        });
    }
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem) return;
    let originToken = actorUtils.getFirstToken(originItem.parent);
    if (!originToken) return;
    affectedTokens = affectedTokens.filter(target => tokenUtils.canSee(originToken, target));
    if (!affectedTokens.length) return;
    let feature = activityUtils.getActivityByIdentifier(originItem, 'conjureAnimalsSave', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, affectedTokens, {atLevel: effect.flags['chris-premades'].castData.castLevel});
    if (turnToCheck) {
        let touchedTokenIds = effect.flags['chris-premades'].conjureAnimals.touchedTokenIds[turnToCheck] ?? [];
        touchedTokenIds.push(...affectedTokens.map(i => i.id));
        await genericUtils.setFlag(effect, 'chris-premades', 'conjureAnimals.touchedTokenIds.' + turnToCheck, touchedTokenIds);
    }
}
export let conjureAnimals = {
    name: 'Conjure Animals',
    version: '1.3.84',
    rules: 'modern',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['conjureAnimals']
            }
        ]
    },
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpectralAnimals',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpectralAnimals',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpectralAnimals',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'nature',
            category: 'animation',
            options: constants.summonAnimationOptions
        }
    ]
};
export let conjureAnimalsActive = {
    name: 'Conjure Animals: Active',
    version: conjureAnimals.version,
    rules: conjureAnimals.rules,
    save: [
        {
            pass: 'situational',
            macro: save,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'turnEndNear',
            macro: turnEnd,
            priority: 50,
            distance: 10,
            disposition: 'enemy'
        }
    ],
    movement: [
        {
            pass: 'moved',
            macro: moved,
            priority: 50
        },
        {
            pass: 'movedNear',
            macro: movedNear,
            priority: 50,
            distance: 10,
            disposition: 'enemy'
        }
    ]
};