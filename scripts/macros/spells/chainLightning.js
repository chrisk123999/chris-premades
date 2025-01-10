import {activityUtils, animationUtils, compendiumUtils, constants, dialogUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    if (!workflow.targets.size) return;
    let maxTargets = workflow.castData.castLevel - 3;
    for (let targetToken of workflow.targets) {
        let nearbyTokens = tokenUtils.findNearby(targetToken, 30, 'ally', {});
        let newTargets = nearbyTokens;
        if (!nearbyTokens.length) continue;
        if (nearbyTokens.length > maxTargets) {
            let selection = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.ChainLightning.Select', {maxTargets}), nearbyTokens, {type: 'multiple', maxAmount: maxTargets});
            if (!selection) {
                continue;
            }
            newTargets = selection[0] ?? [];
        }
        let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
        let jb2aCheck = animationUtils.jb2aCheck();
        if (playAnimation && jb2aCheck) {
            let color = itemUtils.getConfig(workflow.item, 'color') ?? 'blue';
            let sequenceObj;
            if (workflow.token !== targetToken) {
                sequenceObj = new Sequence()
                    .effect()
                    .atLocation(workflow.token)
                    .stretchTo(targetToken)
                    .file('jb2a.chain_lightning.primary.' + color)
                    .waitUntilFinished(-1250);
            } else {
                sequenceObj = new Sequence()
                    .effect()
                    .atLocation(workflow.token)
                    .file('jb2a.static_electricity.01.' + color)
                    .scaleToObject(1.5)
                    .waitUntilFinished(-1250);
            }
            let prevTarget = targetToken;
            for (let target of newTargets) {
                sequenceObj
                    .effect()
                    .atLocation(prevTarget)
                    .stretchTo(target)
                    .file('jb2a.chain_lightning.secondary.' + color)
                    .waitUntilFinished(-1500);
                prevTarget = target;
            }
            sequenceObj.play();
        }
        let feature = activityUtils.getActivityByIdentifier(workflow.item, 'chainLightningLeap', {strict: true});
        if (!feature) return;
        await activityUtils.setDamage(feature, workflow.damageTotal);
        await workflowUtils.syntheticActivityRoll(feature, newTargets);
    }
}
export let chainLightning = {
    name: 'Chain Lightning',
    version: '1.1.10',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['chainLightning']
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
            default: 'blue',
            category: 'animation',
            options: [
                {
                    value:'blue',
                    label:'CHRISPREMADES.Config.Colors.Blue'
                },
                {
                    value:'blue02',
                    label:'CHRISPREMADES.Config.Colors.Blue02',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value:'dark_purple',
                    label:'CHRISPREMADES.Config.Colors.DarkPurple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value:'dark_red',
                    label:'CHRISPREMADES.Config.Colors.DarkRed',
                    requiredModules: ['jb2a_patreon']},
                {
                    value:'green',
                    label:'CHRISPREMADES.Config.Colors.Green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value:'green02',
                    label:'CHRISPREMADES.Config.Colors.Green02',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value:'orange',
                    label:'CHRISPREMADES.Config.Colors.Orange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value:'red',
                    label:'CHRISPREMADES.Config.Colors.Red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value:'purple',
                    label:'CHRISPREMADES.Config.Colors.Purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value:'yellow',
                    label:'CHRISPREMADES.Config.Colors.Yellow',
                    requiredModules: ['jb2a_patreon']
                },
            ]
        }
    ]
};