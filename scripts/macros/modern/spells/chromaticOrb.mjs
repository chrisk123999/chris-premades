import {automationUtils, dialogUtils, animationUtils, rollUtils, tokenUtils, itemUtils, constants, workflowUtils} from '../../../proxy.mjs'; // Utils come from a proxy from CAT now
async function damage({document, workflow}) { // trigger -> document
    if (!workflow.hitTargets.size) return;
    const damageTypes = automationUtils.getConfigValue(document.item, 'damageTypes'); // itemUtils.getConfig -> automationUtils.getConfigValue -- workflow.item -> document.item
    if (!damageTypes.length) return;
    let damageType = document.flags['chris-premades']?.chromaticOrb?.damageType ?? await dialogUtils.selectDamageType(damageTypes, document.name, 'CHRISPREMADES.Generic.SelectDamageType');
    if (!damageType) damageType = damageTypes[0];
    workflow.damageRolls.forEach(roll => roll.options.type = damageType);
    await workflow.setDamageRolls(workflow.damageRolls);
}
async function use({document, workflow, castData, token}) { // trigger -> document
    if (!token) return; // Token is included in scope since this is from a workflow
    const lastTargetUuid = document.flags['chris-premades']?.chromaticOrb?.lastTargetUuid ?? workflow.token.document.uuid;
    const lastTarget = await fromUuid(lastTargetUuid);
    if (automationUtils.getConfigValue(document, 'playAnimation') && animationUtils.jb2aCheck()) {
        const anim = 'jb2a.ranged.03.projectile.01.bluegreen';
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
    if (!workflow.damageRolls || !workflow.hitTargets.size) return;
    const alwaysBounce = automationUtils.getConfigValue(document.item, 'alwaysBounce');
    const canBounce = alwaysBounce || rollUtils.hasDuplicateDie([workflow.damageRolls[0]]);
    if (!canBounce) return;
    const baseMaxJumps = automationUtils.getConfigValue(document.item, 'baseMaxJumps');
    const castLevel = document.item.flags['chris-premades']?.chromaticOrb?.castLevel ?? castData.castLevel; // Cast Data is always includded in scope
    let bouncesLeft = document.item.flags['chris-premades']?.chromaticOrb?.bouncesLeft ?? baseMaxJumps + castLevel - 1;
    if (bouncesLeft <= 0) return;
    bouncesLeft--;
    const ignoredTargetUuids = document.item.flags['chris-premades']?.chromaticOrb?.ignoredTargetUuids ?? [];
    const range = automationUtils.getConfigValue(document.item, 'range');
    const nearbyTargets = tokenUtils.findNearby(workflow.targets.first().document, range, {disposition: 'ally'}).filter(i => !ignoredTargetUuids.includes(i.uuid));
    // Uses document now instead of token placeable, disposition is now in options, return gives documents as well now.
    if (!nearbyTargets.length) return;
    let nextTarget = nearbyTargets[0];
    if (nearbyTargets.length > 1) {
        const targetSelect = (await dialogUtils.selectTargetDialog(document.name, 'CHRISPREMADES.Macros.ChromaticOrb.Bounce', nearbyTargets, {skipDeadAndUnconscious: false}))?.result;
        // Dialog utils now return an object with a result propety, so we take that directly. Also returns target as single or array depending on `type`, default is single
        if (targetSelect) {
            nextTarget = targetSelect;
        } else return;
    }
    const perTargetDamageType = automationUtils.getConfigValue(document.item, 'perTargetDamageType');
    ignoredTargetUuids.push(workflow.targets.first().document.uuid);
    workflow.item = workflow.item.clone({
        'flags.chris-premades.chromaticOrb': {
            ignoredTargetUuids,
            damageType: perTargetDamageType ? undefined : workflow.damageRolls[0].options.type,
            bouncesLeft,
            castLevel,
            lastTargetUuid: workflow.targets.first().document.uuid
        }
    }, {keepId: true});
    const activity = itemUtils.getActivityByIdentifier(workflow.item, 'chromaticOrbBounce'); //  activityUtils.getAc... -> itemUtils.getAc... -- No longer needs {strict: true}
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [nextTarget], {atLevel: castLevel});
}
export const chromaticOrb = {
    version: '2.0.2',
    rules: '2024', // `rules` is now the number (2014 vs 2024) because item rules have the number. Folders in CPR are modern vs legacy because the rules setting is modern vs legacy.
    roll: [ // Midi item and midi actor passes have been combined into `roll`
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        },
        {
            pass: 'activityDamageRoll', // Runs on damage roll, and only for its own activity.
            macro: damage,
            priority: 50
        }
    ],
    config: { // Config is now an object instead of an array, `value` is now the key
        playAnimation: {
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animations'
        },
        alwaysBounce: {
            label: 'CHRISPREMADES.Macros.Legacy.ChaosBolt.AlwaysBounce',
            type: 'checkbox',
            default: false,
            homebrew: true,
            category: 'homebrew'
        },
        baseMaxJumps: {
            label: 'CHRISPREMADES.Macros.Modern.ChromaticOrb.BaseMaxJumps',
            type: 'number',
            default: 1,
            homebrew: true,
            category: 'homebrew'
        },
        damageTypes: {
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['acid', 'cold', 'fire', 'lightning', 'poison', 'thunder'],
            get options() { // Anything using a helper in the config needs to use a getter because constants will not be set when the module is first loaded
                return constants.damageTypeOptions;
            },
            category: 'homebrew',
            homebrew: true
        },
        perTargetDamageType: {
            label: 'CHRISPREMADES.Macros.Modern.ChromaticOrb.TargetDamageSelection',
            type: 'checkbox',
            default: false,
            homebrew: true,
            category: 'homebrew'
        },
        range: {
            label: 'CHRISPREMADES.Config.Range',
            type: 'number',
            default: 30,
            homebrew: true,
            category: 'homebrew'
        }
    }
};