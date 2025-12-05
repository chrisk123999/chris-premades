import {activityUtils, animationUtils, dialogUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let blastsLeft = workflowUtils.getCastLevel(workflow) + itemUtils.getConfig(workflow.item, 'baseAttacks');
    let blast = activityUtils.getActivityByIdentifier(workflow.item, 'blast', {strict: true});
    if (!blast) return;
    while (blastsLeft) {
        let selection, skip;
        if (workflow.targets.size > 1) {
            [selection, skip] = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.EldritchBlast.Target', Array.from(workflow.targets), {type: 'selectAmount', skipDeadAndUnconscious: true, coverToken: workflow.token, maxAmount: blastsLeft});
            if (!selection) return;
        } else {
            selection = [{document: workflow.targets.first(), value: 1}];
        }
        for (let i of selection) {
            for (let j = 0; j < i.value; j++) {
                let hp = i.document.actor?.system?.attributes?.hp?.value;
                if (!hp && skip) continue;
                await workflowUtils.syntheticActivityRoll(blast, [i.document], {options: {targetConfirmation: 'none'}});
                blastsLeft -= 1;
            }
        }
    }
}
async function blast({trigger, workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (!playAnimation) return;
    let color = itemUtils.getConfig(workflow.item, 'color');
    let sound = itemUtils.getConfig(workflow.item, 'sound');
    if (color === 'random') {
        let colors = spellfireFlare.config.find(i => i.value === 'color').options.map(j => j.value).filter(k => k !== 'random');
        color = colors[Math.floor(Math.random() * colors.length)];
    }
    if (!color) return;
    let animation = 'jb2a.ranged.03.projectile.01.' + color;
    animationUtils.simpleAttack(workflow.token, workflow.targets.first(), animation, {sound: sound, missed: !workflow.hitTargets.has(workflow.targets.first())});
}
async function attack({trigger, workflow}) {
    let coverBonus = tokenUtils.checkCover(workflow.token, workflow.targets.first(), {item: workflow.item});
    if (!(coverBonus == 2 || coverBonus == 5)) return;
    await workflowUtils.bonusAttack(workflow, String(coverBonus));
}
export let spellfireFlare = {
    name: 'Spellfire Flare',
    version: '1.3.159',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'attackRollComplete',
                macro: blast,
                priority: 50,
                activities: ['blast']
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            },
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 50,
                activities: ['blast']
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
                    label: 'CHRISPREMADES.Config.Colors.BlueGreen'
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
            value: 'sound',
            label: 'CHRISPREMADES.Config.Sound',
            type: 'file',
            default: '',
            category: 'sound'
        },
        {
            value: 'baseAttacks',
            label: 'CHRISPREMADES.Config.BaseAttacks',
            type: 'number',
            default: 0,
            category: 'homebrew',
            homebrew: true
        }
    ]
};