import {activityUtils, automationUtils, dataUtils, documentUtils, effectUtils, Logging, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const bonus = activityUtils.getRange(workflow.activity) || workflowUtils.getRange(workflow);
    const range = bonus || tokenUtils.movementSpent(workflow.token.document, true);
    if (!range) return Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(workflow.item), 'CHRISPREMADES.Macros.Generic.MovementAnimation.NoMovement', {notify: 'warn'});
    const {animation: selectLocationsAnimation, options: selectLocationsOptions} = automationUtils.getResolvedAnimation(document, 'selectLocationsAnimation', {source: 'chris-premades', identifier: 'movementAnimation'});
    if (!selectLocationsAnimation) return Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(workflow.item), 'Select locations animation not available.', {notify: 'warn'});
    const {animation: moveAnimation} = automationUtils.getResolvedAnimation(document, 'moveAnimation', {source: 'chris-premades', identifier: 'movementAnimation'});
    if (!moveAnimation) return Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(workflow.item), 'Move animation not available.', {notify: 'warn'});
    const positions = await selectLocationsAnimation.macros?.select(workflow.token.document, range, selectLocationsOptions);
    if (!positions?.length) return;
    const movementEffectId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'movementAnimation', 'movementEffect');
    let effect;
    if (movementEffectId) {
        const sourceEffect = document.item.effects.get(movementEffectId);
        if (sourceEffect) {
            const effectData = sourceEffect.toObject();
            delete effectData._id;
            dataUtils.setOrigin(effectData, sourceEffect);
            effect = (await effectUtils.createEffects(workflow.actor, [effectData]))?.[0];
        }
    }
    await moveAnimation.macros?.move(workflow.token.document, positions);
    if (effect) await documentUtils.deleteDocument(effect);
}
/**
 * After the activity is used, prompts for locations within range and moves the user's token through them. Range is the
 * activity's range, or the token's remaining movement when the activity has none.
 */
export const movementAnimation = {
    rules: 'all',
    version: '2.1.0',
    category: 'movement',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        selectLocationsAnimation: {
            default: {
                source: 'chris-premades',
                identifier: 'selectLocations'
            },
            type: 'selectAnimation',
            category: 'animations',
            inputs: ['token', 'range', 'options'],
            label: 'CHRISPREMADES.Macros.Generic.MovementAnimation.SelectAnimation',
            hint: 'CHRISPREMADES.Macros.Generic.MovementAnimation.SelectLocationsAnimation.Hint'
        },
        moveAnimation: {
            default: {
                source: 'chris-premades',
                identifier: 'cunningActionDash'
            },
            type: 'selectAnimation',
            category: 'animations',
            inputs: ['token', 'positions'],
            label: 'CHRISPREMADES.Macros.Generic.MovementAnimation.MoveAnimation.Label',
            hint: 'CHRISPREMADES.Macros.Generic.MovementAnimation.MoveAnimation.Hint'
        },
        movementEffect: {
            default: '',
            type: 'selectEffect',
            category: 'animations',
            label: 'CHRISPREMADES.Macros.Generic.MovementAnimation.MovementEffect.Label',
            hint: 'CHRISPREMADES.Macros.Generic.MovementAnimation.MovementEffect.Hint'
        }
    }
};