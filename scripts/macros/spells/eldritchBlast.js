import {actorUtils, compendiumUtils, constants, dialogUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
async function use(workflow) {
    let level = actorUtils.getLevelOrCR(workflow.actor);
    let boltsLeft = 1 + Math.floor(level * 0.2);
    if (!workflow.targets.size) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Eldritch Blast: Beam');
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
            homebrew: true
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.config.formula',
            type: 'text',
            default: '1d10[force]',
            homebrew: true
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.config.playAnimation',
            type: 'checkbox',
            default: true
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.config.color',
            type: 'select',
            default: 'purple',
            options: [
                {
                    value: 'dark_green',
                    label: 'CHRISPREMADES.config.colors.darkGreen',
                    patreon: true
                },
                {
                    value: 'dark_pink',
                    label: 'CHRISPREMADES.config.colors.darkPink',
                    patreon: true
                },
                {
                    value: 'dark_purple',
                    label: 'CHRISPREMADES.config.colors.darkPurple',
                    patreon: true
                },
                {
                    value: 'dark_red',
                    label: 'CHRISPREMADES.config.colors.darkRed',
                    patreon: true
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.config.colors.green',
                    patreon: true
                },
                {
                    value: 'lightblue',
                    label: 'CHRISPREMADES.config.colors.lightBlue',
                    patreon: true
                },
                {
                    value: 'lightgreen',
                    label: 'CHRISPREMADES.config.colors.lightGreen',
                    patreon: true
                },
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.config.colors.orange',
                    patreon: true
                },
                {
                    value: 'pink',
                    label: 'CHRISPREMADES.config.colors.pink',
                    patreon: true
                },
                {
                    value: 'yellow',
                    label: 'CHRISPREMADES.config.colors.yellow',
                    patreon: true
                },
                {
                    value: 'rainbow',
                    label: 'CHRISPREMADES.config.colors.rainbow',
                    patreon: true
                },
                {
                    value: 'random',
                    label: 'CHRISPREMADES.config.colors.random',
                    patreon: true
                }
            ]
        },
        {
            value: 'sound',
            label: 'CHRISPREMADES.config.sound',
            type: 'file',
            default: ''
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