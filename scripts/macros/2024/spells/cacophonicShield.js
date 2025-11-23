import {activityUtils, animationUtils, combatUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    effectData.origin = sourceEffect.uuid;
    genericUtils.setProperty(effectData, 'flags.chris-premades.cacophonicShield.touchedTokenIds', {});
    genericUtils.setProperty(effectData, 'flags.chris-premades.castData', {
        baseLevel: workflow.castData.baseLevel,
        castLevel: workflowUtils.getCastLevel(workflow),
        saveDC: itemUtils.getSaveDC(workflow.item)
    });
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let color = itemUtils.getConfig(workflow.item, 'color');
    if (animationUtils.jb2aCheck() !== 'patreon') color = 'blue';
    let animation;
    if (color === 'random') {
        let colors = [
            'blue',
            'dark_purple',
            'dark_red',
            'green',
            'orange'
        ];
        color = colors[Math.floor(Math.random() * colors.length)];
    }
    if (playAnimation) {
        animation = {
            animationPath: 'jb2a.thunderwave.center.' + color,
            animationSize: workflow.token.document.width + 4
        };
    }
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item,
        interdependent: true
    }, animation);
    let nearbyTokens = tokenUtils.findNearby(workflow.token, 10, 'enemy');
    await damageHelper(nearbyTokens, effect, workflow.token);
}
async function moved({trigger: {token, entity: effect}, options}) {
    let startPoint = genericUtils.duplicate(options._movement[token.id].origin);
    let offset = token.document.width * token.document.parent.grid.size / 2;
    startPoint.x += offset;
    startPoint.y += offset;
    let endPoint = {x: token.center.x, y: token.center.y};
    let radius = 10 + token.document.width * token.document.parent.grid.distance;
    let affectedTokens = Array.from(tokenUtils.getMovementHitTokens(startPoint, endPoint, radius));
    await damageHelper(affectedTokens, effect, token);
}
async function damageHelper(affectedTokens, effect, token) {
    let allcacophonicShieldEffects = token.document.parent.tokens
        .filter(i => i.disposition === token.disposition)
        .map(i => effectUtils.getEffectByIdentifier(i.actor, 'cacophonicShieldSourceEffect'))
        .filter(i => i);
    affectedTokens = affectedTokens.filter(i => !MidiQOL.checkIncapacitated(i.actor) && token.document.disposition !== i.document.disposition);
    if (combatUtils.inCombat()) {
        let turn = combatUtils.currentTurn();
        affectedTokens = affectedTokens.filter(target => {
            let used = allcacophonicShieldEffects.find(i => i.flags['chris-premades'].cacophonicShield.touchedTokenIds[turn]?.includes(target.id));
            return !used;
        });
    }
    if (!affectedTokens.length) return;
    let originItem = await effectUtils.getOriginItem(effect);
    let activity = activityUtils.getActivityByIdentifier(originItem, 'cacophonicShieldDamage', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, affectedTokens, {atLevel: effect.flags['chris-premades'].castData.castLevel});
    if (combatUtils.inCombat()) {
        let turn = combatUtils.currentTurn();
        let touchedTokenIds = effect.flags['chris-premades'].cacophonicShield.touchedTokenIds[turn] ?? [];
        touchedTokenIds.push(...affectedTokens.map(i => i.id));
        await genericUtils.setFlag(effect, 'chris-premades', 'cacophonicShield.touchedTokenIds.' + turn, touchedTokenIds);
    }
}
async function turnEnd({trigger: {token, target, entity: effect, previousTurn, previousRound}}) {
    let turn = previousRound + '-' + previousTurn;
    let allcacophonicShieldEffects = token.document.parent.tokens
        .filter(i => i.disposition === token.disposition)
        .map(i => effectUtils.getEffectByIdentifier(i.actor, 'cacophonicShieldSourceEffect'))
        .filter(i => i);
    let used = allcacophonicShieldEffects.find(i => i.flags['chris-premades'].cacophonicShield.touchedTokenIds[turn]?.includes(target.id));
    if (used) return;
    let originItem = await effectUtils.getOriginItem(effect);
    let activity = activityUtils.getActivityByIdentifier(originItem, 'cacophonicShieldDamage', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [target], {atLevel: effect.flags['chris-premades'].castData.castLevel});
    let touchedTokenIds = effect.flags['chris-premades'].cacophonicShield.touchedTokenIds[turn] ?? [];
    touchedTokenIds.push(target.id);
    await genericUtils.setFlag(effect, 'chris-premades', 'cacophonicShield.touchedTokenIds.' + turn, touchedTokenIds);
}
async function moveOrTurn({trigger: {target, token, entity: effect}, options}) {
    if (options) {
        let movementOrigin = genericUtils.duplicate(options._movement?.[target.id]?.origin);
        let tempToken = await target.actor.getTokenDocument({
            x: movementOrigin?.x ?? target.x,
            y: movementOrigin?.y ?? target.y,
            elevation: movementOrigin?.elevation ?? target.elevation,
            actorLink: false,
            hidden: true,
            delta: {ownership: target.actor.ownership}
        }, {parent: target.document.parent});
        let oldDistance = tokenUtils.getDistance(token, tempToken);
        if (oldDistance <= 10) return;
    }
    if (combatUtils.inCombat()) {
        let turn = combatUtils.currentTurn();
        let nearbycacophonicShieldEffects = tokenUtils.findNearby(target, 10, 'enemy', {includeToken: true}).filter(i => effectUtils.getEffectByIdentifier(i.actor, 'cacophonicShieldSourceEffect')).map(j => effectUtils.getEffectByIdentifier(j.actor, 'cacophonicShieldSourceEffect'));
        let used = nearbycacophonicShieldEffects.find(i => i.flags['chris-premades'].cacophonicShield.touchedTokenIds[turn]?.includes(target.id));
        if (used) return;
    }
    let originItem = await effectUtils.getOriginItem(effect);
    let activity = activityUtils.getActivityByIdentifier(originItem, 'cacophonicShieldDamage', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [target], {atLevel: effect.flags['chris-premades'].castData.castLevel});
    if (combatUtils.inCombat()) {
        let turn = combatUtils.currentTurn();
        let touchedTokenIds = effect.flags['chris-premades'].cacophonicShield.touchedTokenIds[turn] ?? [];
        touchedTokenIds.push(target.id);
        await genericUtils.setFlag(effect, 'chris-premades', 'cacophonicShield.touchedTokenIds.' + turn, touchedTokenIds);
    }
}
export let cacophonicShield = {
    name: 'Cacophonic Shield',
    version: '1.3.140',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
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
            value: 'color',
            label: 'CHRISPREMADES.Config.Color',
            type: 'select',
            default: 'blue',
            category: 'animation',
            options: [
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue'
                },
                {
                    value: 'dark_purple',
                    label: 'CHRISPREMADES.Config.Colors.DarkPurple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_red',
                    label: 'CHRISPREMADES.Config.Colors.DarkRed',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.Config.Colors.Orange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'random',
                    label: 'CHRISPREMADES.Config.Colors.Random',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        }
    ],
    hasAnimation: true
};
export let cacophonicShieldSourceEffect = {
    name: 'Cacophonic Shield: Source',
    version: cacophonicShield.version,
    rules: cacophonicShield.rules,
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
            pass: 'movedNear',
            macro: moveOrTurn,
            distance: 10,
            priority: 50,
            disposition: 'enemy'
        },
        {
            pass: 'moved',
            macro: moved,
            priority: 50
        }
    ]
};