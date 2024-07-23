import {actorUtils, animationUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    let alignment = actorUtils.getAlignment(workflow.actor);
    let damageType;
    if (alignment.includes('good') || alignment.includes('neutral')) {
        damageType = 'radiant';
    } else if (alignment.includes('evil')) {
        damageType = 'necrotic';
    } else {
        damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.macros.spiritGuardians.alignment', [['CHRISPREAMDES.alignment.good', 'radiant'], ['CHRISPREMADES.alignment.neutral', 'radiant'], ['CHRISPREMADES.alignment.evil', 'necrotic']], {displayAsRows: true});
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
                    castDC: itemUtils.getSaveDC(workflow.item)
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
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Spirit Guardians: Damage', {object: true, identifier: 'spiritGuardiansDamage', flatDC: trigger.castData.castDC, translate: 'CHRISPREMADES.macros.spiritGuardians.damage'});
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
            label: 'CHRISPREMADES.config.playAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.config.color',
            type: 'select',
            category: 'animation',
            default: 'blueyellow',
            options: [
                {
                    value: 'blueyellow',
                    label: 'CHRISPREMADES.config.colors.blueYellow'
                },
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.config.colors.blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_black',
                    label: 'CHRISPREMADES.config.colors.darkBlack',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_blue',
                    label: 'CHRISPREMADES.config.colors.darkBlue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_purple',
                    label: 'CHRISPREMADES.config.colors.darkPurple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_red',
                    label: 'CHRISPREMADES.config.colors.darkRed',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_whiteblue',
                    label: 'CHRISPREMADES.config.colors.darkWhiteBlue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.config.colors.green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.config.colors.orange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'greenorange',
                    label: 'CHRISPREMADES.config.colors.greenOrange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'pinkpurple',
                    label: 'CHRISPREMADES.config.colors.pinkPurple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'random',
                    label: 'CHRISPREMADES.config.colors.random',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'variation',
            label: 'CHRISPREMADES.macros.spiritGuardians.variation',
            type: 'select',
            default: 'ring',
            category: 'animation',
            options: [
                {
                    value: 'ring',
                    label: 'CHRISPREMADES.macros.spiritGuardians.ring'
                },
                {
                    value: 'no_ring',
                    label: 'CHRISPREMADES.macros.spiritGuardians.noRing',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'particles',
                    label: 'CHRISPREMADES.macros.spiritGuardians.particles',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'spirits',
                    label: 'CHRISPREMADES.macros.spiritGuardians.spirits',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'sound',
            label: 'CHRISPREMADES.config.sound',
            type: 'file',
            default: '',
            category: 'sound'
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.config.formula',
            type: 'text',
            default: 'd8',
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