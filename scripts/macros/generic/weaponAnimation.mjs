import {automationUtils, workflowUtils} from '../../proxy.mjs';
import {playTargetAnimations} from './spellAnimation.mjs';
export async function playWeaponAnimation(document, workflow) {
    if (!workflow.token || !workflow.targets.count) return;
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'weaponAnimation', ['activityId', 'advanced']);
    if (config.activityId && config.activityId !== workflow.activity?.id) return;
    if (config.advanced) {
        const {animation, options} = automationUtils.getResolvedAnimation(document, 'advancedAnimation', {source: 'chris-premades', identifier: 'weaponAnimation'});
        if (!animation?.macros?.attack) return;
        await animation.macros.attack(workflow.token.document, workflow.targets.tokens.map(token => token.document), {...options, switchDistance: workflowUtils.getRange(workflow)});
        return;
    }
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'weaponAnimation'});
    const ammunition = workflow.ammunition ?? workflow.actor?.items.get(workflow.attackRoll?.options?.ammunition);
    const attackMode = workflow.attackMode ?? workflow.attackRoll?.options?.attackMode;
    await playTargetAnimations(workflow, {animation, options: {...options, item: workflow.item, activity: workflow.activity, ammunition, attackMode, misfire: workflowUtils.getWorkflowProperty(workflow, 'firearmMisfire')}});
}
async function attack({document, workflow}) {
    if (workflowUtils.getWorkflowProperty(workflow, 'skipWeaponAnimation')) return;
    playWeaponAnimation(document, workflow);
}
async function saveShot({document, workflow}) {
    if (workflow.activity?.type !== 'save' || document.type !== 'weapon') return;
    await attack({document, workflow});
}
/**
 * Plays an attack animation from the attacker to each target after the attack roll, or after the saves for a weapon's
 * save activity such as a cone or burst of fire. Set the workflow property `skipWeaponAnimation` to turn it off.
 */
export const weaponAnimation = {
    rules: 'all',
    version: '2.1.10',
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
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Activity',
            hint: 'CHRISPREMADES.Macros.Generic.WeaponAnimation.Activity.Hint'
        },
        advanced: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.WeaponAnimation.Advanced.Label',
            hint: 'CHRISPREMADES.Macros.Generic.WeaponAnimation.Advanced.Hint'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'weaponAttack'
            },
            type: 'selectAnimation',
            category: 'animations',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: 'CHRISPREMADES.Macros.Generic.WeaponAnimation.Animation.Hint'
        },
        advancedAnimation: {
            default: {
                source: 'chris-premades',
                identifier: 'advancedMeleeAttack'
            },
            type: 'selectAnimation',
            category: 'animations',
            inputs: ['sourceToken', 'targetTokens', 'options'],
            label: 'CHRISPREMADES.Macros.Generic.WeaponAnimation.AdvancedAnimation.Label',
            hint: 'CHRISPREMADES.Macros.Generic.WeaponAnimation.AdvancedAnimation.Hint'
        }
    }
};
