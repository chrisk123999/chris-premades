import {automationUtils, constants, dialogUtils, documentUtils, itemUtils, Logging, rollUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
import {applyDamageType} from '../../generic/selectDamageType.mjs';
import {getDamageType} from '../../generic/spellAnimation.mjs';
async function damage({document, workflow}) {
    if (!workflow.hitTargets.size) return;
    const damageTypes = automationUtils.getConfigValue(document, 'damageTypes');
    if (!damageTypes.length) return;
    await applyDamageType(workflow, workflow.workflowOptions?.['chris-premades']?.chromaticOrb?.damageType ?? (await dialogUtils.selectDamageType(damageTypes, document.name, 'CHRISPREMADES.Generic.SelectDamageType') || damageTypes[0]));
}
export async function playBolt(document, workflow, target, state) {
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    const sourceToken = (state && fromUuidSync(state.lastTargetUuid)) ?? workflow.token.document;
    if (animation) await animation.macros.play(sourceToken, target.document, {...options, cast: options.cast && !state, damageType: getDamageType(workflow), hit: workflow.hitTargets.has(target)});
}
export async function bounce(document, target, {state, stateKey, activityIdentifier, range, dialogText, castLevel, extraState = {}}) {
    const ignoredUuids = [...(state?.ignoredUuids ?? []), target.document.uuid];
    const nearbyTargets = tokenUtils.findNearby(target.document, range, {disposition: 'ally'}).filter(token => !ignoredUuids.includes(token.uuid));
    if (!nearbyTargets.length) return;
    let nextTarget = nearbyTargets[0];
    if (nearbyTargets.length > 1) {
        nextTarget = (await dialogUtils.selectTargetDialog(document.name, dialogText, nearbyTargets, {skipDeadAndUnconscious: false}))?.result;
        if (!nextTarget) return;
    }
    const activity = itemUtils.getActivityByIdentifier(document, activityIdentifier);
    if (!activity) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(document), 'Bounce activity missing from item.', {notify: 'warn'});
    await workflowUtils.syntheticActivityRoll(activity, [nextTarget], {
        atLevel: castLevel,
        options: {workflowOptions: {'chris-premades': {[stateKey]: {...extraState, ignoredUuids, castLevel, lastTargetUuid: target.document.uuid}}}}
    });
}
async function use({document, workflow, castData}) {
    const target = workflow.targets.first();
    if (!workflow.token || !target) return;
    const state = workflow.workflowOptions?.['chris-premades']?.chromaticOrb;
    await playBolt(document, workflow, target, state);
    if (!workflow.hitTargets.has(target) || !workflow.damageRolls?.length) return;
    if (!automationUtils.getConfigValue(document, 'alwaysBounce') && !rollUtils.hasDuplicateDie([workflow.damageRolls[0]])) return;
    const castLevel = state?.castLevel ?? castData.castLevel;
    const bouncesLeft = state?.bouncesLeft ?? automationUtils.getConfigValue(document, 'baseMaxJumps') + castLevel - 1;
    if (bouncesLeft <= 0) return;
    await bounce(document, target, {
        state,
        stateKey: 'chromaticOrb',
        activityIdentifier: 'chromaticOrbBounce',
        range: automationUtils.getConfigValue(document, 'range'),
        dialogText: 'CHRISPREMADES.Macros.Modern.ChromaticOrb.Bounce',
        castLevel,
        extraState: {
            bouncesLeft: bouncesLeft - 1,
            damageType: automationUtils.getConfigValue(document, 'perTargetDamageType') ? undefined : workflow.damageRolls[0].options.type
        }
    });
}
export const chromaticOrb = {
    name: 'Chromatic Orb',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {
            pass: 'itemDamageRoll',
            macro: damage,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
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
            get options() { return constants.damageTypeOptions; },
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
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'chromaticOrb'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
