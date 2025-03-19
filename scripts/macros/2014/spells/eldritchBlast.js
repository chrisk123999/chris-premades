import {activityUtils, actorUtils, animationUtils, compendiumUtils, constants, dialogUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let level = actorUtils.getLevelOrCR(workflow.actor);
    let boltsLeft = 1 + Math.floor((level + 1) * (1/6)); //Todo: Make this work with twinned spell somehow.
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'eldritchBlastBeam', {strict: true});
    if (!feature) return;
    while (boltsLeft) {
        let selection, skip;
        if (workflow.targets.size > 1) {
            [selection, skip] = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.EldritchBlast.Target', Array.from(workflow.targets), {type: 'selectAmount', skipDeadAndUnconscious: true, coverToken: workflow.token, maxAmount: boltsLeft});
            if (!selection) return;
        } else {
            selection = [{document: workflow.targets.first(), value: 1}];
        }
        for (let i of selection) {
            for (let j = 0; j < i.value; j++) {
                let hp = i.document.actor?.system?.attributes?.hp?.value;
                if (!hp && skip) continue;
                await workflowUtils.syntheticActivityRoll(feature, [i.document], {options: {targetConfirmation: 'none'}});
                boltsLeft -= 1;
            }
        }
    }
}
async function beam({trigger, workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (!playAnimation) return;
    let color = itemUtils.getConfig(workflow.item, 'color');
    let sound = itemUtils.getConfig(workflow.item, 'sound');
    if (color === 'random') {
        let colors = eldritchBlast.config.find(i => i.value === 'color').options.map(j => j.value).filter(k => k !== 'random');
        color = colors[Math.floor(Math.random() * colors.length)];
    }
    if (!color) return;
    let animation = 'jb2a.eldritch_blast.' + color;
    animationUtils.simpleAttack(workflow.token, workflow.targets.first(), animation, {sound: sound, missed: !workflow.hitTargets.has(workflow.targets.first())});
}
async function damage({trigger, workflow}) {
    let agonizingBlast = itemUtils.getItemByIdentifier(workflow.actor, 'agonizingBlast');
    if (!agonizingBlast) return;
    await workflowUtils.bonusDamage(workflow, String(workflow.actor.system.abilities.cha.mod), {ignoreCrit: true, damageType: workflow.defaultDamageType});
}
export let eldritchBlast = {
    name: 'Eldritch Blast',
    version: '1.2.28',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'attackRollComplete',
                macro: beam,
                priority: 50,
                activities: ['eldritchBlastBeam']
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['eldritchBlast']
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50,
                activities: ['eldritchBlastBeam']
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
            default: 'purple',
            category: 'animation',
            options: [
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.Config.Colors.Purple'
                },
                {
                    value: 'dark_green',
                    label: 'CHRISPREMADES.Config.Colors.DarkGreen',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_pink',
                    label: 'CHRISPREMADES.Config.Colors.DarkPink',
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
                    value: 'lightblue',
                    label: 'CHRISPREMADES.Config.Colors.LightBlue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'lightgreen',
                    label: 'CHRISPREMADES.Config.Colors.LightGreen',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.Config.Colors.Orange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'pink',
                    label: 'CHRISPREMADES.Config.Colors.Pink',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'yellow',
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'rainbow',
                    label: 'CHRISPREMADES.Config.Colors.Rainbow',
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
            category: 'sound'
        }
    ]
};