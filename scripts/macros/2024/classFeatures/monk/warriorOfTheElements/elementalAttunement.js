import {chooseResistance} from './elementalEpitome.js';
import {DialogApp} from '../../../../../applications/dialog.js';
import {activityUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [],
        flags: {
            dae: {
                stackable: 'noneName',
                enableCondition: '!statuses.incapacitated'
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['elementalAttunementElementalStrikes']);
    if (itemUtils.getItemByIdentifier(workflow.actor, 'strideOfTheElements')) {
        effectData.changes.push(
            {
                key: 'system.attributes.movement.fly',
                value: '@attributes.movement.speed',
                mode: 4,
                priority: 20
            },
            {
                key: 'system.attributes.movement.swim',
                value: '@attributes.movement.speed',
                mode: 4,
                priority: 20
            }
        );
    }
    let epitome = itemUtils.getItemByIdentifier(workflow.actor, 'elementalEpitome');
    if (epitome) {
        effectData.changes.push(
            {
                key: 'system.traits.dr.value',
                value: await chooseResistance(epitome),
                mode: 2,
                priority: 20
            }
        );
        genericUtils.setProperty(effectData, 'flags.chris-premades.unhideActivities', {
            itemUuid: epitome.uuid,
            activityIdentifiers: ['swap'],
            favorite: true
        });
        effectUtils.addMacro(effectData, 'midi.actor', ['elementalEpitomeEmpoweredStrikes']);
    }
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'elementalAttunementEffect', 
        rules: 'modern',        
        avatarImg: itemUtils.getConfig(workflow.item, 'avatarImg'),
        tokenImg: itemUtils.getConfig(workflow.item, 'tokenImg'),
        avatarImgPriority: itemUtils.getConfig(workflow.item, 'avatarImgPriority'),
        tokenImgPriority: itemUtils.getConfig(workflow.item, 'tokenImgPriority')
    });
    let items = constants.unarmedAttacks.flatMap(i => itemUtils.getAllItemsByIdentifier(workflow.actor, i));
    if (!items.length) return;
    let enchantmentData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'system.range.reach',
                mode: 4,
                value: 15,
                priority: 20
            }
        ]
    };
    await Promise.all(items.map(async i => {
        enchantmentData.changes[0].value = (i.system.range.reach ?? 5) + 10;
        await itemUtils.enchantItem(i, enchantmentData, {parentEntity: effect, strictlyInterdependent: true, identifier: 'elementalAttunementEnchantment'});
    }));
}
async function damage({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item))) return;
    if (activityUtils.getIdentifier(workflow.activity) !== 'punch') return;
    let item = await effectUtils.getOriginItem(effect);
    if (!item) return;
    let damageType = effect.flags['chris-premades']?.elementalAttunement;
    let remember = itemUtils.getConfig(item, 'remember');
    if (!remember || !damageType) {
        let damageOptions = itemUtils.getConfig(item, 'damageTypes');
        let defaultType = damageType || damageOptions[0];
        damageOptions = damageOptions.map(d => {
            let image = constants.damageIcons[d] ?? 'icons/magic/symbols/question-stone-yellow.webp';
            return {label: CONFIG.DND5E.damageTypes[d].label, name: d, options: {image, isChecked: d === defaultType}};
        });
        damageOptions.push({label: 'CHRISPREMADES.Generic.No', name: 'no', options: {image: constants.damageIcons.no, isChecked: defaultType === 'no'}});
        let inputs = [
            ['radio', damageOptions, {displayAsRows: true, radioName: 'damageType'}],
            [
                'checkbox',
                [{label: 'CHRISPREMADES.Config.Remember', name: 'remember', options: {isChecked: remember}}],
                {displayAsRows: true}
            ]
        ];
        let selection = await DialogApp.dialog(item.name, 'CHRISPREMADES.Macros.AwakenedSpellbook.Select', inputs, 'okCancel');
        if (!selection || !selection.buttons) return;
        let updates = {};
        if (selection.damageType !== damageType) await genericUtils.setFlag(effect, 'chris-premades', 'elementalAttunement', selection.damageType);
        if (selection.remember !== remember) await itemUtils.setConfig(item, 'remember', selection.remember);
        damageType = selection.damageType;
    }
    if (!damageType || damageType === 'no') return;
    genericUtils.setProperty(workflow, 'chris-premades.elementalAttunementUsed', true);
    for (let i = 0; i < workflow.activity.damage.parts.length; i++) {
        workflow.damageRolls[i].options.type = damageType;
    }
    await workflow.setDamageRolls(workflow.damageRolls);
}
async function late({trigger: {entity: effect}, workflow}) {
    if (!workflow['chris-premades']?.elementalAttunementUsed) return;
    if (!workflow.hitTargets.size) return;
    let item = await effectUtils.getOriginItem(effect);
    if (!item) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'move', {strict: true});
    if(!activity) return;
    let target = workflow.hitTargets.first();
    let current = tokenUtils.getDistance(workflow.token, target);
    let label = (dist, dir) => 
        genericUtils.translate('CHRISPREMADES.Distance.' + dist) + 
        ' ' + genericUtils.translate('CHRISPREMADES.Direction.' + dir);
    let buttons  = [
        [label(10, 'Away'), 10],
        [label(5, 'Away'), 5],
        ['CHRISPREMADES.Generic.None', 0]
    ];
    if (current > 5) buttons.push([label(5, 'Towards'), -5]);
    if (current > 10) buttons.push([label(10, 'Towards'), -10]);
    let distance = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Crusher.Move', buttons);
    if (!distance || distance === '0') return;
    let save = await workflowUtils.syntheticActivityRoll(activity, workflow.hitTargets);
    if (!save?.failedSaves.size) return;
    await tokenUtils.pushToken(workflow.token, target, distance);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'monksFocus');
}
export let elementalAttunement = {
    name: 'Elemental Attunement',
    version: '1.5.22',
    rules: 'modern',
    hasAnimation: true,
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
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 45
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 45
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 45
        }
    ],
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['acid', 'cold', 'fire', 'lightning', 'thunder'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'remember',
            label: 'CHRISPREMADES.Config.Remember',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'default',
            category: 'animation',
            options: [
                {
                    value: 'air',
                    label: 'CHRISPREMADES.Config.Animations.Air',
                    requiredModules: ['animated-spell-effects-cartoon', 'jb2a_patreon']
                },
                {
                    value: 'default',
                    label: 'CHRISPREMADES.Config.Animations.Default',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'fire',
                    label: 'CHRISPREMADES.Config.Animations.Fire',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'lightning',
                    label: 'CHRISPREMADES.Config.Animations.Lightning',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'none',
                    label: 'CHRISPREMADES.Config.Animations.None',
                    requiredModules: []
                },
                {
                    value: 'water',
                    label: 'CHRISPREMADES.Config.Animations.Water',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'tokenImg',
            label: 'CHRISPREMADES.Config.TokenImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'tokenImgPriority',
            label: 'CHRISPREMADES.Config.TokenImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        },
        {
            value: 'avatarImg',
            label: 'CHRISPREMADES.Config.AvatarImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'avatarImgPriority',
            label: 'CHRISPREMADES.Config.AvatarImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        }
    ]
};
export let elementalAttunementElementalStrikes = {
    ...elementalAttunement,
    name: 'Elemental Attunement: Elemental Strikes',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 150
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};
