import {activityUtils, animationUtils, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let maxBolts = 1 + workflowUtils.getCastLevel(workflow);
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'bolt', {strict: true});
    if (!activity) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let jb2a = animationUtils.jb2aCheck();
    if (playAnimation && !jb2a) playAnimation = false;
    let color = itemUtils.getConfig(workflow.item, 'color');
    if (jb2a != 'patreon') color = 'purple';
    let sound = itemUtils.getConfig(workflow.item, 'sound');
    let colors = darkBolt.config.find(i => i.value === 'color').options.map(j => j.value).filter(k => k != 'random');
    let details;
    if (workflow.targets.size > 1) {
        let selection = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.DarkBolt.Select', {maxBolts}), Array.from(workflow.targets), {type: 'selectAmount', maxAmount: maxBolts, skipDeadAndUnconscious: false});
        if (!selection) return;
        details = selection[0].map(i => ({document: i.document, value: Number(i.value)})).filter(i => i.value);
        if (!details.length) return;
    } else {
        details = [
            {
                document: workflow.targets.first(),
                value: maxBolts
            }
        ];
    }
    for (let detail of details) {
        let activityData = genericUtils.duplicate(activity.toObject());
        activityData.damage.parts[0].number = detail.value;
        let attackWorkflow = await workflowUtils.syntheticActivityDataRoll(activityData, workflow.item, workflow.actor, [detail.document]);
        let selectedColor = color;
        if (color === 'random') selectedColor = colors[Math.floor(Math.random() * colors.length)];
        let animation = 'jb2a.eldritch_blast.' + selectedColor;
        for (let i = 0; i < (detail.value); i++) {
            animationUtils.simpleAttack(workflow.token, attackWorkflow.targets.first(), animation, {sound: sound, missed: !attackWorkflow.hitTargets.has(attackWorkflow.targets.first())});
            if (detail.value > 1 && i != detail.value) await genericUtils.sleep(1000);
        }
    }
}
export let darkBolt = {
    name: 'Darkbolt',
    version: '1.4.9',
    rules: 'legacy',
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