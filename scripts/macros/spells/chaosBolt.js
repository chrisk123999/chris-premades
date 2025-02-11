import {activityUtils, animationUtils, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';
async function use({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) === genericUtils.getIdentifier(workflow.item)) {
        // Clear flags
        await genericUtils.setFlag(workflow.item, 'chris-premades', '-=chaosBolt', null);
    }
    if (!workflow.hitTargets.size) return;
    let chrisFlags = workflow.item.flags['chris-premades'];
    let buttons = [
        ['DND5E.DamageAcid', 'acid', {image: 'icons/magic/acid/projectile-faceted-glob.webp'}],
        ['DND5E.DamageCold', 'cold', {image: 'icons/magic/air/wind-tornado-wall-blue.webp'}],
        ['DND5E.DamageFire', 'fire', {image: 'icons/magic/fire/beam-jet-stream-embers.webp'}],
        ['DND5E.DamageForce', 'force', {image: 'icons/magic/sonic/projectile-sound-rings-wave.webp'}],
        ['DND5E.DamageLightning', 'lightning', {image: 'icons/magic/lightning/bolt-blue.webp'}],
        ['DND5E.DamagePoison', 'poison', {image: 'icons/magic/death/skull-poison-green.webp'}],
        ['DND5E.DamagePsychic', 'psychic', {image: 'icons/magic/control/fear-fright-monster-grin-red-orange.webp'}],
        ['DND5E.DamageThunder', 'thunder', {image: 'icons/magic/sonic/explosion-shock-wave-teal.webp'}],
    ];
    let currentTarget = workflow.targets.first();
    let origTargetUuid = chrisFlags?.chaosBolt?.targetUuid;
    let animSource = origTargetUuid ? (await fromUuid(origTargetUuid)).object : workflow.token;
    let castLevel = chrisFlags?.chaosBolt?.castLevel ?? workflowUtils.getCastLevel(workflow);
    let ignoreList = chrisFlags?.chaosBolt?.ignoreList ?? [];
    let alwaysBounce = chrisFlags?.chaosBolt?.alwaysBounce ?? itemUtils.getConfig(workflow.item, 'alwaysBounce');
    let playAnimation = chrisFlags?.chaosBolt?.playAnimation ?? itemUtils.getConfig(workflow.item, 'playAnimation');
    let [dice1, dice2] = workflow.damageRolls[0].terms[0].values;
    let damageType = buttons[dice1 - 1][1];
    if (dice1 !== dice2) {
        let choice = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.ChaosBolt.Select', [buttons[dice1 - 1], buttons[dice2 - 1]]);
        damageType = choice ?? damageType;
    }
    workflow.damageRolls[0].options.type = damageType;
    workflow.damageRolls[1].options.type = damageType;
    await workflow.setDamageRolls(workflow.damageRolls);
    if (playAnimation && animationUtils.jb2aCheck()) {
        let anim = 'jb2a.ranged.03.projectile.01.bluegreen';
        await new Sequence()
            .effect()
            .atLocation(animSource)
            .stretchTo(currentTarget)
            .file(anim)
            .missed(!workflow.hitTargets.size)
            .filter('ColorMatrix', animationUtils.colorMatrix(anim, damageType))
            .waitUntilFinished()
            .play();
    }
    ignoreList.push(currentTarget.document.uuid);
    if ((dice1 === dice2 && workflow.hitTargets.size) || alwaysBounce) {
        let nearbyTargets = await tokenUtils.findNearby(currentTarget, 30, 'ally', {includeIncapacitated: true}).filter(i => !ignoreList.includes(i.document.uuid));
        if (!nearbyTargets.length) return;
        let nextTarget = nearbyTargets[0];
        if (nearbyTargets.length > 1) {
            let targetSelect = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.ChaosBolt.Bounce', nearbyTargets);
            if (targetSelect) nextTarget = targetSelect[0];
        }
        let feature = activityUtils.getActivityByIdentifier(workflow.item, 'chaosBoltBounce', {strict: true});
        if (!feature) return;
        await genericUtils.setFlag(workflow.item, 'chris-premades', 'chaosBolt', {
            ignoreList,
            targetUuid: currentTarget.document.uuid,
            castLevel,
            alwaysBounce,
            playAnimation
        });
        await workflowUtils.syntheticActivityRoll(feature, [nextTarget], {atLevel: castLevel});
    }
}
export let chaosBolt = {
    name: 'Chaos Bolt',
    version: '1.1.10',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'alwaysBounce',
            label: 'CHRISPREMADES.Macros.ChaosBolt.AlwaysBounce',
            type: 'checkbox',
            default: false,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ],
    ddbi: {
        correctedItems: {
            'Chaos Bolt': {
                system: {
                    scaling: {
                        formula: '',
                        mode: 'none'
                    }
                }
            }
        }
    }
};