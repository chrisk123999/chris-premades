import {activityUtils, actorUtils, animationUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
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
                    damageType: damageType,
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
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, identifier: 'spiritGuardiansDamage', interdependent: true});
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (!playAnimation) return;
    let color = itemUtils.getConfig(workflow.item, 'color');
    let variation = '.' + itemUtils.getConfig(workflow.item, 'variation');
    if (color === 'random') {
        let colors = spiritGuardians.config.find(i => i.value === 'color').options.map(j => j.value).filter(k => k != 'random');
        color = colors[Math.floor(Math.random() * colors.length)];
    }
    if (animationUtils.jb2aCheck() === 'free') {
        color = 'blueyellow';
        variation = '.ring';
    }
    let sound = itemUtils.getConfig(workflow.item, 'sound');
    /* eslint-disable indent */
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
    /* eslint-enable indent */
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
        }, {parent: canvas.scene});
        let oldDistance = tokenUtils.getDistance(token, tempToken);
        if (oldDistance <= genericUtils.convertDistance(15)) return;
    }
    if (combatUtils.inCombat()) {
        let turn = combatUtils.currentTurn();
        let nearbySpiritGuardianEffects = tokenUtils.findNearby(target, 15, 'enemy', {includeToken: true}).filter(i => effectUtils.getEffectByIdentifier(i.actor, 'spiritGuardiansDamage')).map(j => effectUtils.getEffectByIdentifier(j.actor, 'spiritGuardiansDamage'));
        let used = nearbySpiritGuardianEffects.find(i => i.flags['chris-premades'].spiritGuardians.touchedTokenIds[turn]?.includes(target.id));

        if (used) return;
    }
    let originItem = await effectUtils.getOriginItem(effect);
    let feature = activityUtils.getActivityByIdentifier(originItem, 'spiritGuardiansDamage', {strict: true});
    if (!feature) return;
    let damageType = feature.damage.parts[0].types.first() ?? effect.flags['chris-premades'].spiritGuardians.damageType;
    let activityData = activityUtils.withChangedDamage(feature, '', [damageType]);
    await workflowUtils.syntheticActivityDataRoll(activityData, originItem, originItem.actor, [target], {atLevel: effect.flags['chris-premades'].castData.castLevel});
    if (combatUtils.inCombat()) {
        let turn = combatUtils.currentTurn();
        let touchedTokenIds = effect.flags['chris-premades'].spiritGuardians.touchedTokenIds[turn] ?? [];
        touchedTokenIds.push(target.id);
        await genericUtils.setFlag(effect, 'chris-premades', 'spiritGuardians.touchedTokenIds.' + turn, touchedTokenIds);
    }
}
async function removed({trigger}) {
    let token = actorUtils.getFirstToken(trigger.entity.parent);
    if (!token) return;
    Sequencer.EffectManager.endEffects({'name': 'spiritGuardians', 'object': token});
}
export let spiritGuardians = {
    name: 'Spirit Guardians',
    version: '1.2.28',
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
            category: 'animation',
            default: 'blueyellow',
            options: [
                {
                    value: 'blueyellow',
                    label: 'CHRISPREMADES.Config.Colors.BlueYellow'
                },
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_black',
                    label: 'CHRISPREMADES.Config.Colors.DarkBlack',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_blue',
                    label: 'CHRISPREMADES.Config.Colors.DarkBlue',
                    requiredModules: ['jb2a_patreon']
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
                    value: 'dark_whiteblue',
                    label: 'CHRISPREMADES.Config.Colors.DarkWhiteBlue',
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
                    value: 'greenorange',
                    label: 'CHRISPREMADES.Config.Colors.GreenOrange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'pinkpurple',
                    label: 'CHRISPREMADES.Config.Colors.PinkPurple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'random',
                    label: 'CHRISPREMADES.Config.Colors.Random',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'variation',
            label: 'CHRISPREMADES.Macros.SpiritGuardians.Variation',
            type: 'select',
            default: 'ring',
            category: 'animation',
            options: [
                {
                    value: 'ring',
                    label: 'CHRISPREMADES.Macros.SpiritGuardians.Ring'
                },
                {
                    value: 'no_ring',
                    label: 'CHRISPREMADES.Macros.SpiritGuardians.NoRing',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'particles',
                    label: 'CHRISPREMADES.Macros.SpiritGuardians.Particles',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'spirits',
                    label: 'CHRISPREMADES.Macros.SpiritGuardians.Spirits',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'sound',
            label: 'CHRISPREMADES.Config.Sound',
            type: 'file',
            default: '',
            category: 'sound'
        }
    ]
};
export let spiritGuardiansDamage = {
    name: 'Spirit Guardians Damage',
    version: spiritGuardians.version,
    effect: [
        {
            pass: 'deleted',
            macro: removed,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'turnStartNear',
            macro: moveOrTurn,
            priority: 50,
            distance: 15,
            disposition: 'enemy'
        }
    ],
    movement: [
        {
            pass: 'movedNear',
            macro: moveOrTurn,
            distance: 15,
            priority: 50,
            disposition: 'enemy'
        }
    ]
};