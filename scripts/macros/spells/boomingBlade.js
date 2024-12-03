import {activityUtils, actorUtils, animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../utils.js';
async function use({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== genericUtils.getIdentifier(workflow.item)) return;
    if (workflow.targets.size !== 1) return;
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && i.system.actionType === 'mwak');
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.BoomingBlade.NoWeapons', 'warn');
        return;
    }
    let selectedWeapon;
    if (weapons.length === 1) {
        selectedWeapon = weapons[0];
    } else {
        selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.BoomingBlade.SelectWeapon', weapons);
        if (!selectedWeapon) return;
    }
    let level = actorUtils.getLevelOrCR(workflow.actor);
    let diceNumber = Math.floor((level + 1) / 6);
    let weaponData = genericUtils.duplicate(selectedWeapon.toObject());
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    if (diceNumber) {
        let attackId = selectedWeapon.system.activities.getByType('attack')?.[0]?.id;
        if (!attackId) return;
        weaponData.system.activities[attackId].damage.parts.push({
            custom: {
                enabled: true,
                formula: diceNumber + 'd8[' + damageType + ']'
            },
            types: [damageType]
        });
    }
    let attackWorkflow = await workflowUtils.syntheticItemDataRoll(weaponData, workflow.actor, [workflow.targets.first()]);
    if (!attackWorkflow) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let color = itemUtils.getConfig(workflow.item, 'color');
    let jb2a = animationUtils.jb2aCheck();
    if (playAnimation && jb2a) {
        if (animationUtils.jb2aCheck() !== 'patreon') color = 'blue';
        if (color === 'random') {
            let colors = [
                'blue',
                'blue02',
                'dark_purple',
                'dark_red',
                'green',
                'green02',
                'orange',
                'red',
                'purple',
                'yellow',
                'blue'
            ];
            color = colors[Math.floor(Math.random() * colors.length)];
        }
        new Sequence()
            .effect()
            .file('jb2a.static_electricity.01.' + color)
            .atLocation(workflow.targets.first())
            .scaleToObject(1.5)
            .play();
    }

    if (!attackWorkflow.hitTargets.size) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 12
        },
        flags: {
            dae: {
                specialDuration: [
                    'turnStartSource'
                ]
            },
            'chris-premades': {
                boomingBlade: {
                    damageType: damageType
                }
            }
        }
    };
    let effect = effectUtils.getEffectByIdentifier(attackWorkflow.targets.first().actor, 'boomingBlade');
    if (effect) {
        if (effect.flags['chris-premades'].boomingBlade.diceNumber > diceNumber) return;
        await genericUtils.remove(effect);
    }
    effectUtils.addMacro(effectData, 'movement', ['boomingBladeMoved']);
    await effectUtils.createEffect(workflow.targets.first().actor, effectData, {identifier: 'boomingBlade'});
}
async function moved({trigger: {entity: effect}}) {
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Macros.BoomingBlade.WillingMove', {actorName: effect.parent.name}));
    if (!selection) return;
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(effect.origin), 'boomingBladeMoved', {strict: true});
    if (!feature) return;
    let parentActor = (await fromUuid(effect.origin))?.actor;
    if (!parentActor) return;
    await workflowUtils.syntheticActivityRoll(feature, [actorUtils.getFirstToken(effect.parent)]);
    await genericUtils.remove(effect);
}
export let boomingBlade = {
    name: 'Booming Blade',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 49
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'thunder',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
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
                    value: 'blue02',
                    label: 'CHRISPREMADES.Config.Colors.Blue02',
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
                    value: 'green',
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green02',
                    label: 'CHRISPREMADES.Config.Colors.Green02',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.Config.Colors.Orange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'red',
                    label: 'CHRISPREMADES.Config.Colors.Red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.Config.Colors.Purple',
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
    ],
    hasAnimation: true
};
export let boomingBladeMoved = {
    name: 'Booming Blade: Moved',
    version: boomingBlade.version,
    movement: [
        {
            pass: 'moved',
            macro: moved,
            priority: 250
        }
    ]
};