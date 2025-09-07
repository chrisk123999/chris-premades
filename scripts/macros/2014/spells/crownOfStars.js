import {activityUtils, animationUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.activity) return;
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'attack', {strict: true});
    if (!activity) return;
    await genericUtils.update(activity, {
        uses: {
            max: (workflowUtils.getCastLevel(workflow) - 7) * 2 + 7,
            spent: 0
        }
    });
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let playTokenAnimation = itemUtils.getConfig(workflow.item, 'playTokenAnimation');
    let options = {};
    if (playTokenAnimation) {
        let jb2a = animationUtils.jb2aCheck();
        if (jb2a) {
            let animation = 'jb2a.markers.circle_of_stars.';
            let tokenColor = itemUtils.getConfig(workflow.item, 'tokenColor');
            if (jb2a != 'patreon') tokenColor = 'blue';
            if (tokenColor === 'random') {
                let colors = ['blue', 'green', 'greenorange', 'orangepurple', 'purplegreen', 'yellowblue'];
                tokenColor = colors[Math.floor((Math.random() * colors.length))];
            }
            let tokenSound = itemUtils.getConfig(workflow.item, 'tokenSound');
            animation += tokenColor;
            options.animationPath = animation;
            if (tokenSound) options.animationSound = tokenSound;
        }
    }
    await effectUtils.createEffect(workflow.actor, effectData, {
        vae: [
            {type: 'use', name: activity.name, identifier: 'attack', activityIdentifier: 'attack'}
        ],
        concentrationItem: workflow.item,
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['attack'],
            favorite: true
        }
    }, options);
}
async function attack({trigger, workflow}) {
    if (!workflow.activity || !workflow.item) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'crownOfStarsEffect');
    if (!effect) return;
    let uses = workflow.actor.items.get(workflow.item.id).system.activities.get(workflow.activity.id).uses.value;
    if (uses > 3) return;
    if (!uses) {
        await genericUtils.remove(effect);
        return;
    }
    if (Number(effect.changes[0].value) === 30) return;
    await genericUtils.update(effect, {
        changes: [
            {
                key: 'ATL.light.dim',
                value: 30,
                mode: 4
            }
        ]
    });
}
async function attackAnimation({trigger, workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (!playAnimation) return;
    let jb2a = animationUtils.jb2aCheck();
    if (!playAnimation || !workflow.token || !workflow.targets.size || !jb2a) return;
    let animation = 'jb2a.ranged.03.instant.01.';
    let color = jb2a === 'patreon' ? itemUtils.getConfig(workflow.item, 'color') : 'bluegreen';
    if (color === 'random') {
        let colors = ['bluegreen', 'pinkpurple', 'yellow'];
        color = colors[Math.floor((Math.random() * colors.length))];
    }
    let sound = itemUtils.getConfig(workflow.item, 'sound');
    workflow.targets.forEach(i => {
        animationUtils.simpleAttack(workflow.token, i, animation + color, {sound: sound, missed: !workflow.hitTargets.has(i)});
    });
}
export let crownOfStars = {
    name: 'Crown of Stars',
    version: '1.3.43',
    rules: 'legacy',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            },
            {
                pass: 'rollFinished',
                macro: attack,
                priority: 50,
                activities: ['attack']
            },
            {
                pass: 'attackRollComplete',
                macro: attackAnimation,
                priority: 50,
                activities: ['attack']
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
            default: 'bluegreen',
            category: 'animation',
            options: [
                {
                    value: 'bluegreen',
                    label: 'CHRISPREMADES.Config.Colors.BlueGreen',
                },
                {
                    value: 'pinkpurple',
                    label: 'CHRISPREMADES.Config.Colors.PinkPurple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'yellow',
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
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
            value: 'playTokenAnimation',
            label: 'CHRISPREMADES.Config.PlayTokenAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'tokenColor',
            label: 'CHRISPREMADES.Config.TokenColor',
            type: 'select',
            default: 'blue',
            category: 'animation',
            options: [
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'greenorange',
                    label: 'CHRISPREMADES.Config.Colors.GreenOrange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'orangepurple',
                    label: 'CHRISPREMADES.Config.Colors.OrangePurple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'purplegreen',
                    label: 'CHRISPREMADES.Config.Colors.PurpleGreen',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'yellowblue',
                    label: 'CHRISPREMADES.Config.Colors.YellowBlue',
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
            value: 'sound',
            label: 'CHRISPREMADES.Config.Sound',
            type: 'file',
            default: '',
            category: 'animation'
        },
        {
            value: 'tokenSound',
            label: 'CHRISPREMADES.Config.TokenSound',
            type: 'file',
            default: '',
            category: 'animation'
        }
    ]
};