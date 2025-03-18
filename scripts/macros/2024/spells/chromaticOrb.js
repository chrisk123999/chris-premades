import {activityUtils, animationUtils, constants, dialogUtils, genericUtils, itemUtils, rollUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function damage({trigger, workflow}) {
    if (!workflow.hitTargets.size) return;
    let damageTypes = itemUtils.getConfig(workflow.item, 'damageTypes');
    if (!damageTypes.length) return;
    let damageType = workflow.item.flags['chris-premades']?.chromaticOrb?.damageType ?? await dialogUtils.selectDamageType(damageTypes, workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType');
    if (!damageType) damageType = damageTypes[0];
    workflow.damageRolls.forEach(roll => roll.options.type = damageType);
    await workflow.setDamageRolls(workflow.damageRolls);
}
async function use({trigger, workflow}) {
    async function reset(item) {
        let identifier = activityUtils.getIdentifier(workflow.activity);
        if (identifier != 'chromaticOrb') return;
        await genericUtils.setFlag(item, 'chris-premades', 'chromaticOrb', null);
    }
    if (!workflow.token) {
        await reset(workflow.item); 
        return;
    }
    let lastTargetUuid = workflow.item.flags['chris-premades']?.chromaticOrb?.lastTargetUuid ?? workflow.token.document.uuid;
    let lastTarget = await fromUuid(lastTargetUuid);
    if (itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck()) {
        let anim = 'jb2a.ranged.03.projectile.01.bluegreen';
        await new Sequence()
            .effect()
            .atLocation(lastTarget.object)
            .stretchTo(workflow.targets.first())
            .file(anim)
            .missed(!workflow.hitTargets.size)
            .filter('ColorMatrix', animationUtils.colorMatrix(anim, workflow.damageRolls?.[0]?.options?.type ?? 'none'))
            .waitUntilFinished()
            .play();
    }
    if (!workflow.damageRolls || !workflow.hitTargets.size) {
        await reset(workflow.item); 
        return;
    }
    let alwaysBounce = itemUtils.getConfig(workflow.item, 'alwaysBounce');
    let canBounce =  !alwaysBounce ? rollUtils.hasDuplicateDie([workflow.damageRolls[0]]) : true;
    if (!canBounce) {
        await reset(workflow.item); 
        return;
    }
    let baseMaxJumps = itemUtils.getConfig(workflow.item, 'baseMaxJumps');
    let castLevel = workflow.item.flags['chris-premades']?.chromaticOrb?.castLevel ?? workflowUtils.getCastLevel(workflow) ?? 0;
    let bouncesLeft = workflow.item.flags['chris-premades']?.chromaticOrb?.bouncesLeft ?? (castLevel - 1 + baseMaxJumps);
    if (!bouncesLeft) {
        await reset(workflow.item); 
        return;
    }
    bouncesLeft--;
    let ignoredTargetUuids = workflow.item.flags['chris-premades']?.chromaticOrb?.ignoredTargetUuids ?? [];
    let range = itemUtils.getConfig(workflow.item, 'range');
    let nearbyTargets = tokenUtils.findNearby(workflow.targets.first(), range, 'ally', {includeIncapacitated: true}).filter(i => !ignoredTargetUuids.includes(i.document.uuid));
    if (!nearbyTargets.length) {
        await reset(workflow.item); 
        return;
    }
    let nextTarget = nearbyTargets[0];
    if (nearbyTargets.length > 1) {
        let targetSelect = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.ChromaticOrb.Bounce', nearbyTargets, {skipDeadAndUnconscious: false});
        if (targetSelect) nextTarget = targetSelect[0];
    }
    let perTargetDamageType = itemUtils.getConfig(workflow.item, 'perTargetDamageType');
    ignoredTargetUuids.push(workflow.targets.first().document.uuid);
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'chromaticOrb', {
        ignoredTargetUuids,
        damageType: perTargetDamageType ? undefined : workflow.damageRolls[0].options.type,
        bouncesLeft,
        castLevel,
        lastTargetUuid: workflow.targets.first().document.uuid
    });
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'chromaticOrbBounce', {strict: true});
    if (!activity) {
        await reset(workflow.item);
        return;
    }
    await workflowUtils.syntheticActivityRoll(activity, [nextTarget], {atLevel: castLevel});
    await reset(workflow.item);
}
export let chromaticOrb = {
    name: 'Chromatic Orb',
    version: '1.2.28',
    rules: 'modern',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
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
            value: 'alwaysBounce',
            label: 'CHRISPREMADES.Macros.ChaosBolt.AlwaysBounce',
            type: 'checkbox',
            default: false,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'baseMaxJumps',
            label: 'CHRISPREMADES.Macros.ChromaticOrb.BaseMaxJumps',
            type: 'number',
            default: 1,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['acid', 'cold', 'fire', 'lightning', 'poison', 'thunder'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'perTargetDamageType',
            label: 'CHRISPREMADES.Macros.ChromaticOrb.TargetDamageSelection',
            type: 'checkbox',
            default: false,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'number',
            default: 30,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};