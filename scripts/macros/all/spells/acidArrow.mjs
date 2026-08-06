import {animationUtils, automationUtils, genericUtils, rollUtils, workflowUtils} from '../../../proxy.mjs';   
async function early({workflow}) {
    genericUtils.setProperty(workflow, 'workflowOptions.autoRollDamage', 'always');
}
async function attack({document, workflow}) {
    let playAnimation = automationUtils.getConfigValue(document.item, 'playAnimation');
    let jb2a = animationUtils.jb2aCheck();
    if (!playAnimation || !workflow.token || !workflow.targets.size || !jb2a) return;
    let animation = 'jb2a.arrow.poison.';
    let color = jb2a === 'patreon' ? automationUtils.getConfigValue(document.item, 'color') : 'green';
    if (color === 'random') {
        let colors = ['blue', 'green', 'pink', 'purple', 'red', 'orange'];
        color = colors[Math.floor((Math.random() * colors.length))];
    }
    let sound = automationUtils.getConfigValue(document.item, 'sound');
    workflow.targets.forEach(i => {
        animationUtils.simpleAttack(workflow.token, i, animation + color, {sound: sound, missed: !workflow.hitTargets.has(i)});
    });
}
async function damage({workflow}) {
    let missedTargets = workflow.targets.filter(i => !workflow.hitTargets.has(i)).map(i => i.document);
    if (!missedTargets.size) return;
    let damageRoll = await rollUtils.damageRoll(String(Math.floor(workflow.damageRoll.total / 2)), workflow.item);
    workflowUtils.applyWorkflowDamage(workflow.token, damageRoll, workflow.defaultDamageType, missedTargets, {flavor: _loc('CHRISPREMADES.Macros.Legacy.AcidArrow.HalfDamage'), sourceItem: workflow.item});
}
export let acidArrow = {
    version: '2.0.2',
    rules: 'all',
    roll: [
        {
            pass: 'activityPreItemRoll',
            macro: early,
            priority: 50
        },
        {
            pass: 'activityAttackRollComplete',
            macro: attack,
            priority: 50
        },
        {
            pass: 'activityDamageComplete',
            macro: damage,
            priority: 50
        }
    ],
    config: {
        playAnimation: {
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        color: {
            label: 'CHRISPREMADES.Config.Color',
            type: 'select',
            default: 'green',
            category: 'animation',
            options: [
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.Config.Colors.Green'
                },
                {
                    value: 'pink',
                    label: 'CHRISPREMADES.Config.Colors.Pink',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'red',
                    label: 'CHRISPREMADES.Config.Colors.Red',
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
        },
        sound: {
            label: 'CHRISPREMADES.Config.Sound',
            type: 'file',
            default: '',
            category: 'animation'
        }
    }
};