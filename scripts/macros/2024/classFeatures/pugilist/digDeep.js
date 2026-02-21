import {effectUtils, genericUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    let source = workflow.item.effects.contents?.[0];
    if (!source) return;
    let effectData = genericUtils.duplicate(source.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let macros = [{
        type: 'effect',
        macros: ['digDeepEffect']
    }];
    await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'diggingDeep',
        rules: 'modern',
        macros,
        avatarImg: itemUtils.getConfig(workflow.item, 'avatarImg'),
        tokenImg: itemUtils.getConfig(workflow.item, 'tokenImg'),
        avatarImgPriority: itemUtils.getConfig(workflow.item, 'avatarImgPriority'),
        tokenImgPriority: itemUtils.getConfig(workflow.item, 'tokenImgPriority')
    });
}
async function start({trigger: {entity: effect}}) {
    let levels = effect.parent.system.attributes.exhaustion ?? 0;
    if (!levels) return;
    await genericUtils.update(effect.parent, {'system.attributes.exhaustion': 0});
    await genericUtils.update(effect, {
        flags: {'chris-premades': {exhaustion: levels}},
        img: `systems/dnd5e/icons/svg/statuses/exhaustion-${levels}.svg`
    });
}
async function end({trigger: {entity: effect}}) {
    let levels = effect.flags['chris-premades']?.exhaustion ?? 0;
    if (!levels) return;
    await genericUtils.update(effect.parent, {'system.attributes.exhaustion': levels});
}
async function preChecks({trigger: {entity: item}}) {
    let digging = effectUtils.getEffectByIdentifier(item.parent, 'diggingDeep');
    let levels = digging?.flags['chris-premades']?.exhaustion ?? item.parent.system.attributes.exhaustion ?? 0;
    if (levels === 5) {
        genericUtils.notify(`[${item.name}] ${genericUtils.translate('CHRISPREMADES.Generic.Failure')}: ${genericUtils.format('DND5E.ExhaustionLevel', {n: 5})}`, 'warn');
        return true;
    }
}
async function restore({trigger: {entity: item}}) {
    let digging = effectUtils.getEffectByIdentifier(item.parent, 'diggingDeep');
    let levels = digging?.flags['chris-premades']?.exhaustion ?? item.parent.system.attributes.exhaustion ?? 0;
    if (digging) await genericUtils.update(digging, {
        flags: {'chris-premades': {exhaustion: levels + 1}},
        img: `systems/dnd5e/icons/svg/statuses/exhaustion-${levels + 1}.svg`
    });
    else await genericUtils.update(item.parent, {'system.attributes.exhaustion': levels + 1});
}
export let digDeep = {
    name: 'Dig Deep',
    version: '1.4.29',
    rules: 'modern',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['activate']
            },
            {
                pass: 'preTargeting',
                macro: preChecks,
                priority: 50,
                activities: ['restore']
            }, 
            {
                pass: 'preambleComplete',
                macro: restore,
                priority: 50,
                activities: ['restore']
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
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'default',
            category: 'animation',
            options: [
                {
                    value: 'default',
                    label: 'CHRISPREMADES.Config.Animations.Default',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'lightning',
                    label: 'CHRISPREMADES.Config.Animations.Lightning',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'saiyan',
                    label: 'CHRISPREMADES.Config.Animations.Saiyan',
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
export let digDeepEffect = {
    name: digDeep.name,
    version: digDeep.version,
    rules: digDeep.rules,
    effect: [
        {
            pass: 'created',
            macro: start,
            priority: 50
        },
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};
