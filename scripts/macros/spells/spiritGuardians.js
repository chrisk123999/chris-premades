import {actorUtils, animationUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';
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
    let formula = workflow.castData.castLevel + itemUtils.getConfig(workflow.item, 'formula');
    let effectData = {
        name: workflow.item.name,
        origin: workflow.item.uuid,
        img: workflow.item.img,
        duration: {
            seconds: workflow.item.system.duration.value * 60
        },
        flags: {
            'chris-premades': {
                spiritGuardians: {
                    damageType: damageType,
                    formula: formula,
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
                    castLevel: workflow.castData.castLevel,
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
            .size(workflow.token.document.width + 6, {'gridUnits': true})
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
async function moveOrTurn({trigger}) {
    if (combatUtils.inCombat()) {
        let turn = combatUtils.currentTurn();
        let nearbySpiritGuardianEffects = tokenUtils.findNearby(trigger.target, 15, 'enemy', {includeToken: true}).filter(i => effectUtils.getEffectByIdentifier(i.actor, 'spiritGuardiansDamage')).map(j => effectUtils.getEffectByIdentifier(j.actor, 'spiritGuardiansDamage'));
        let used = nearbySpiritGuardianEffects.find(i => i.flags['chris-premades'].spiritGuardians.touchedTokenIds[turn]?.includes(trigger.target.id));

        if (used) return;
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Spirit Guardians: Damage', {object: true, identifier: 'spiritGuardiansDamage', flatDC: trigger.castData.saveDC, translate: 'CHRISPREMADES.Macros.SpiritGuardians.Damage'});
    let damageType = trigger.entity.flags['chris-premades'].spiritGuardians.damageType;
    featureData.system.damage.parts = [
        [
            trigger.entity.flags['chris-premades'].spiritGuardians.formula + '[' + damageType + ']',
            damageType
        ]
    ];
    await workflowUtils.syntheticItemDataRoll(featureData, trigger.token.actor, [trigger.target]);
    if (combatUtils.inCombat()) {
        let turn = combatUtils.currentTurn();
        let touchedTokenIds = trigger.entity.flags['chris-premades'].spiritGuardians.touchedTokenIds[turn] ?? [];
        touchedTokenIds.push(trigger.target.id);
        await genericUtils.setFlag(trigger.entity, 'chris-premades', 'spiritGuardians.touchedTokenIds.' + turn, touchedTokenIds);
    }
}
async function removed({trigger}) {
    let token = actorUtils.getFirstToken(trigger.entity.parent);
    if (!token) return;
    Sequencer.EffectManager.endEffects({'name': 'spiritGuardians', 'object': token});
}
export let spiritGuardians = {
    name: 'Spirit Guardians',
    version: '0.12.0',
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
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: 'd8',
            category: 'homebrew',
            homebrew: true
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