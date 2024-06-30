import {animationUtils, compendiumUtils, constants, dialogUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
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
    let castLevel = chrisFlags?.chaosBolt?.castLevel ?? workflow.castData.castLevel;
    let ignoreList = chrisFlags?.chaosBolt?.ignoreList ?? [];
    let alwaysBounce = chrisFlags?.chaosBolt?.alwaysBounce ?? itemUtils.getConfig(workflow.item, 'alwaysBounce');
    let playAnimation = chrisFlags?.chaosBolt?.playAnimation ?? itemUtils.getConfig(workflow.item, 'playAnimation');
    let [dice1, dice2] = workflow.damageRolls[0].terms[0].values;
    let damageType = buttons[dice1 - 1][1];
    if (dice1 !== dice2) {
        let choice = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.macros.chaosBolt.select', [buttons[dice1 - 1], buttons[dice2 - 1]]);
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
            let targetSelect = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.macros.chaosBolt.bounce', nearbyTargets);
            if (targetSelect) nextTarget = targetSelect[0];
        }
        let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Chaos Bolt: Bounce', {getDescription: true, translate: 'CHRISPREMADES.macros.chaosBolt.bounce', object: true});
        if (!featureData) {
            errors.missingPackItem();
            return;
        }
        genericUtils.setProperty(featureData, 'flags.chris-premades.chaosBolt', {
            ignoreList,
            targetUuid: currentTarget.document.uuid,
            castLevel,
            alwaysBounce,
            playAnimation
        });
        featureData.system.damage.parts[1][0] = castLevel + 'd6';
        await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [nextTarget]);
    }
}
export let chaosBolt = {
    name: 'Chaos Bolt',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'postDamageRoll',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'alwaysBounce',
            label: 'CHRISPREMADES.macros.chaosBolt.alwaysBounce',
            type: 'checkbox',
            default: false,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.config.playAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};