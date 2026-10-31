import {automationUtils, workflowUtils} from '../../proxy.mjs';
import {playTargetAnimations} from './spellAnimation.mjs';
async function attack({document, workflow}) {
    if (!workflow.token || !workflow.targets.size || workflowUtils.getWorkflowProperty(workflow, 'skipWeaponAnimation')) return;
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'weaponAnimation', ['activityId', 'advanced']);
    if (config.activityId && config.activityId !== workflow.activity?.id) return;
    if (config.advanced) {
        const {animation, options} = automationUtils.getResolvedAnimation(document, 'advancedAnimation', {source: 'chris-premades', identifier: 'weaponAnimation'});
        if (!animation?.macros?.attack) return;
        await animation.macros.attack(workflow.token.document, workflow.targets.map(token => token.document), {...options, switchDistance: workflow.rangeDetails.range});
        return;
    }
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'weaponAnimation'});
    const ammunition = workflow.ammunition ?? workflow.actor?.items.get(workflow.attackRoll?.options?.ammunition);
    const attackMode = workflow.attackMode ?? workflow.attackRoll?.options?.attackMode;
    playTargetAnimations(workflow, {animation, options: {...options, item: workflow.item, activity: workflow.activity, ammunition, attackMode, misfire: workflowUtils.getWorkflowProperty(workflow, 'firearmMisfire')}});
}
async function saveShot({document, workflow}) {
    if (workflow.activity?.type !== 'save' || document.type !== 'weapon') return;
    await attack({document, workflow});
}
/**
 * Plays an attack animation from the attacker to each target after the attack roll, or after the saves for a weapon's save activity such as a cone or burst of fire.
 * Bound on an item. Fires on `itemAttackRollComplete` and `itemSavesComplete`.
 * Set the workflow property `skipWeaponAnimation` to turn off.
 *
 * Config:
 * - `activityId`: only animate when this activity is used. Empty animates every activity.
 * - `advanced`: play `advancedAnimation` instead of `animation`.
 * - `animation`: played from the attacker to each target. The default, Weapon Attack, picks a swing, throw or shot from the weapon, and plays a smoke puff when a firearm misfires.
 * - `advancedAnimation`: played from the attacker to all targets, using the attack's range as the switch distance. The default is Advanced Melee Attack.
 */
export const weaponAnimation = {
    rules: 'all',
    version: '2.1.7',
    category: 'animations',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemAttackRollComplete',
            macro: attack,
            priority: 50
        },
        {
            pass: 'itemSavesComplete',
            macro: saveShot,
            priority: 50
        }
    ],
    genericConfig: {
        activityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Config.Activity',
            hint: 'CHRISPREMADES.Macros.Generic.WeaponAnimation.ActivityHint'
        },
        advanced: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Generic.WeaponAnimation.Advanced',
            hint: 'CHRISPREMADES.Macros.Generic.WeaponAnimation.AdvancedHint'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'weaponAttack'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: ''
        },
        advancedAnimation: {
            default: {
                source: 'chris-premades',
                identifier: 'advancedMeleeAttack'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetTokens', 'options'],
            label: 'CHRISPREMADES.Macros.Generic.WeaponAnimation.AdvancedAnimation',
            hint: ''
        }
    }
};
