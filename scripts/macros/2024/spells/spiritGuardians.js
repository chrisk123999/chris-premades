import {spiritGuardians as spiritGuardiansLegacy, spiritGuardiansDamage as spiritGuardiansDamageLegacy} from '../../../legacyMacros.js';
import {activityUtils, actorUtils, animationUtils, combatUtils, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let alignment = actorUtils.getAlignment(workflow.actor);
    let damageType;
    if (alignment.includes(genericUtils.translate('CHRISPREMADES.Alignment.Evil').toLowerCase())) {
        damageType = 'necrotic';
    } else if (alignment.includes(genericUtils.translate('CHRISPREMADES.Alignment.Good').toLowerCase()) || alignment.includes(genericUtils.translate('CHRISPREMADES.Alignment.Neutral').toLowerCase())) {
        damageType = 'radiant';
    } else {
        damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.SpiritGuardians.Alignment', [['CHRISPREMADES.Alignment.Good', 'radiant'], ['CHRISPREMADES.Alignment.Neutral', 'radiant'], ['CHRISPREMADES.Alignment.Evil', 'necrotic']], {displayAsRows: true});
        if (!damageType) damageType = 'radiant';        
    }
    let effectData = {
        name: workflow.item.name,
        origin: workflow.item.uuid,
        img: workflow.item.img,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                spiritGuardians: {
                    damageType,
                    touchedTokenIds: {}
                },
                macros: {
                    movement: [
                        'spiritGuardiansDamage'
                    ],
                    combat: [
                        'spiritGuardiansDamage'
                    ],
                    effect: [
                        'spiritGuardiansDamage'
                    ]
                },
                castData: {
                    baseLevel: workflow.castData.baseLevel,
                    castLevel: workflowUtils.getCastLevel(workflow),
                    saveDC: itemUtils.getSaveDC(workflow.item)
                }
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item, 
        identifier: 'spiritGuardiansDamage',
        interdependent: true,
        rules: 'modern'
    });
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (playAnimation) {
        let color = itemUtils.getConfig(workflow.item, 'color');
        let variation = '.' + itemUtils.getConfig(workflow.item, 'variation');
        if (color === 'random') {
            let colors = spiritGuardians.config.find(i => i.value === 'color').options.map(j => j.value).filter(k => k !== 'random');
            color = colors[Math.floor(Math.random() * colors.length)];
        }
        if (animationUtils.jb2aCheck() === 'free') {
            color = 'blueyellow';
            variation = '.ring';
        }
        let sound = itemUtils.getConfig(workflow.item, 'sound');
        new Sequence()
            .effect()
            .file('jb2a.spirit_guardians.' + color + variation)
            .size(workflow.token.document.width + 6, {gridUnits: true})
            .attachTo(workflow.token)
            .persist()
            .name('spiritGuardians')
            .fadeIn(300)
            .fadeOut(300)
    
            .sound()
            .playIf(sound)
            .file(sound)
    
            .play();
    }
    let nearbyTokens = tokenUtils.findNearby(workflow.token, 15, 'enemy');
    await damageHelper(nearbyTokens, effect, workflow.token);
}
async function moved({trigger: {token, entity: effect}, options}) {
    let startPoint = genericUtils.duplicate(options._movement[token.id].origin);
    let offset = token.document.width * canvas.grid.size / 2;
    startPoint.x += offset;
    startPoint.y += offset;
    let endPoint = {x: token.center.x, y: token.center.y};
    let radius = 15 + token.document.width * canvas.grid.distance;
    let affectedTokens = Array.from(tokenUtils.getMovementHitTokens(startPoint, endPoint, radius));
    await damageHelper(affectedTokens, effect, token);
}
async function damageHelper(affectedTokens, effect, token) {
    let allSpiritGuardianEffects = canvas.tokens.placeables
        .filter(i => i.document.disposition === token.document.disposition)
        .map(i => effectUtils.getEffectByIdentifier(i.actor, 'spiritGuardiansDamage'))
        .filter(i => i);
    affectedTokens = affectedTokens.filter(i => !MidiQOL.checkIncapacitated(i.actor) && token.document.disposition !== i.document.disposition);
    if (combatUtils.inCombat()) {
        let turn = combatUtils.currentTurn();
        affectedTokens = affectedTokens.filter(target => {
            let used = allSpiritGuardianEffects.find(i => i.flags['chris-premades'].spiritGuardians.touchedTokenIds[turn]?.includes(target.id));
            return !used;
        });
    }
    if (!affectedTokens.length) return;
    let originItem = await effectUtils.getOriginItem(effect);
    let feature = activityUtils.getActivityByIdentifier(originItem, 'spiritGuardiansDamage', {strict: true});
    if (!feature) return;
    let damageType = feature.damage.parts[0].types.first() ?? effect.flags['chris-premades'].spiritGuardians.damageType;
    let activityData = activityUtils.withChangedDamage(feature, '', [damageType]);
    await workflowUtils.syntheticActivityDataRoll(activityData, originItem, originItem.actor, affectedTokens, {atLevel: effect.flags['chris-premades'].castData.castLevel});
    if (combatUtils.inCombat()) {
        let turn = combatUtils.currentTurn();
        let touchedTokenIds = effect.flags['chris-premades'].spiritGuardians.touchedTokenIds[turn] ?? [];
        touchedTokenIds.push(...affectedTokens.map(i => i.id));
        await genericUtils.setFlag(effect, 'chris-premades', 'spiritGuardians.touchedTokenIds.' + turn, touchedTokenIds);
    }
}
async function turnEnd({trigger: {token, target, entity: effect, previousTurn, previousRound}}) {
    let turn = previousRound + '-' + previousTurn;
    let allSpiritGuardianEffects = canvas.tokens.placeables
        .filter(i => i.document.disposition === token.document.disposition)
        .map(i => effectUtils.getEffectByIdentifier(i.actor, 'spiritGuardiansDamage'))
        .filter(i => i);
    let used = allSpiritGuardianEffects.find(i => i.flags['chris-premades'].spiritGuardians.touchedTokenIds[turn]?.includes(target.id));
    if (used) return;
    let originItem = await effectUtils.getOriginItem(effect);
    let feature = activityUtils.getActivityByIdentifier(originItem, 'spiritGuardiansDamage', {strict: true});
    if (!feature) return;
    let damageType = feature.damage.parts[0].types.first() ?? effect.flags['chris-premades'].spiritGuardians.damageType;
    let activityData = activityUtils.withChangedDamage(feature, '', [damageType]);
    await workflowUtils.syntheticActivityDataRoll(activityData, originItem, originItem.actor, [target], {atLevel: effect.flags['chris-premades'].castData.castLevel});
    let touchedTokenIds = effect.flags['chris-premades'].spiritGuardians.touchedTokenIds[turn] ?? [];
    touchedTokenIds.push(target.id);
    await genericUtils.setFlag(effect, 'chris-premades', 'spiritGuardians.touchedTokenIds.' + turn, touchedTokenIds);
}
export let spiritGuardians = {
    name: 'Spirit Guardians',
    version: '1.2.28',
    rules: 'modern',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['spiritGuardians']
            }
        ]
    },
    config: spiritGuardiansLegacy.config
};
export let spiritGuardiansDamage = {
    name: 'Spirit Guardians Damage',
    version: spiritGuardians.version,
    rules: spiritGuardians.rules,
    effect: spiritGuardiansDamageLegacy.effect,
    combat: [
        {
            pass: 'turnEndNear',
            macro: turnEnd,
            priority: 50,
            distance: 15,
            disposition: 'enemy'
        }
    ],
    movement: [
        ...spiritGuardiansDamageLegacy.movement,
        {
            pass: 'moved',
            macro: moved,
            priority: 50
        }
    ]
};
