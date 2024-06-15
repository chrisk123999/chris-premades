import {actorUtils, animationUtils, compendiumUtils, constants, dialogUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
async function use(workflow) {
    let level = actorUtils.getLevelOrCR(workflow.actor);
    let boltsLeft = 1 + Math.floor((level + 1) * (1/6));
    if (!workflow.targets.size) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Eldritch Blast: Beam', {object: true});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.damage.parts[0] = [
        itemUtils.getConfig(workflow.item, 'formula'),
        itemUtils.getConfig(workflow.item, 'damageType')
    ];
    let agonizingBlast = itemUtils.getItemByIdentifer(workflow.actor, 'agonizingBlast');
    if (agonizingBlast) featureData.system.damage.parts[0][0] += ' + @mod';
    featureData.system.ability = workflow.item.system.ability;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let color = itemUtils.getConfig(workflow.item, 'color');
    let sound = itemUtils.getConfig(workflow.item, 'sound');
    genericUtils.setProperty(featureData, 'flags.chris-premades.eldritchBlast.sound', sound);
    while (boltsLeft) {
        let selection, skip;
        if (level >= 5) {
            [selection, skip] = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.eldritchBlast.target', Array.from(workflow.targets), {type: 'selectAmount', skipDeadAndUnconscious: true, coverToken: workflow.token, maxAmount: boltsLeft});
            if (!selection) return;
        } else {
            selection = [{document: workflow.targets.first(), value: 1}];
        }
        if (playAnimation) {
            if (color === 'random') color = eldritchBlast.config[Math.floor(Math.random() * 10)].value;
            genericUtils.setProperty(featureData, 'flags.chris-premades.eldritchBlast.color', color);
        }
        for (let i of selection) {
            for (let j = 0; j < i.value; j++) {
                let hp = i.document.actor?.system?.attributes?.hp?.value;
                if (!hp && skip) continue;
                await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [i.document]);
                boltsLeft -= 1;
            }
        }
    }
}
async function beam(workflow) {
    let color = workflow.item.flags['chris-premades']?.eldritchBlast?.color;
    if (!color) return;
    let sound = workflow.item.flags['chris-premades']?.eldritchBlast?.sound;
    let animation = 'jb2a.eldritch_blast.' + color;
    animationUtils.simpleAttack(workflow.token, workflow.targets.first(), animation, {sound: sound, missed: !workflow.hitTargets.has(workflow.targets.first())});
}
export let eldritchBlast = {
    name: 'Eldritch Blast',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.config.damageType',
            type: 'select',
            default: 'force',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.config.formula',
            type: 'text',
            default: '1d10[force]',
            homebrew: true,
            category: 'homebrew'
        },
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
            default: 'purple',
            category: 'animation',
            options: [
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.config.colors.purple'
                },
                {
                    value: 'dark_green',
                    label: 'CHRISPREMADES.config.colors.darkGreen',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_pink',
                    label: 'CHRISPREMADES.config.colors.darkPink',
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
                    value: 'green',
                    label: 'CHRISPREMADES.config.colors.green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'lightblue',
                    label: 'CHRISPREMADES.config.colors.lightBlue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'lightgreen',
                    label: 'CHRISPREMADES.config.colors.lightGreen',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.config.colors.orange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'pink',
                    label: 'CHRISPREMADES.config.colors.pink',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'yellow',
                    label: 'CHRISPREMADES.config.colors.yellow',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'rainbow',
                    label: 'CHRISPREMADES.config.colors.rainbow',
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
            value: 'sound',
            label: 'CHRISPREMADES.config.sound',
            type: 'file',
            default: '',
            category: 'sound'
        }
    ]
};
export let eldritchBlastBeam = {
    name: 'Eldritch Blast: Beam',
    version: eldritchBlast.version,
    midi: {
        item: [
            {
                pass: 'postAttackRollComplete',
                macro: beam,
                priority: 50
            }
        ]
    }
};