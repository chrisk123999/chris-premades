import {automationUtils, documentUtils, effectUtils, Logging, tokenUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const bonus = workflow.activity.range.value || workflow.rangeDetails.range;
    const range = bonus || tokenUtils.movementSpent(workflow.token.document, true);
    if (!range) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(workflow.item), 'CHRISPREMADES.Macros.Generic.MovementAnimation.NoMovement', {notify: 'warn'});
    const {animation: selectLocationsAnimation, options: selectLocationsOptions} = automationUtils.getResolvedAnimation(document, 'selectLocationsAnimation', {source: 'chris-premades', identifier: 'movementAnimation'});
    if (!selectLocationsAnimation) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(workflow.item), 'Select locations animation not available.', {notify: 'warn'});
    const {animation: moveAnimation} = automationUtils.getResolvedAnimation(document, 'moveAnimation', {source: 'chris-premades', identifier: 'movementAnimation'});
    if (!moveAnimation) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(workflow.item), 'Move animation not available.', {notify: 'warn'});
    const positions = await selectLocationsAnimation.macros?.select(workflow.token.document, range, selectLocationsOptions);
    if (!positions?.length) return;
    const movementEffectId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'movementAnimation', 'movementEffect');
    let effect;
    if (movementEffectId) {
        const sourceEffect = document.item.effects.get(movementEffectId);
        if (sourceEffect) {
            const effectData = sourceEffect.toObject();
            delete effectData._id;
            effectData.origin = sourceEffect.uuid;
            effect = (await effectUtils.createEffects(workflow.actor, [effectData]))?.[0];
        }
    }
    await moveAnimation.macros?.move(workflow.token.document, positions);
    if (effect) await documentUtils.deleteDocument(effect);
}
/**
 * Prompts for locations within range once the roll finishes, then moves the user's token through them.
 * Bound on an activity. Fires on `activityRollFinished`.
 *
 * Config:
 * - `selectLocationsAnimation`: picks the locations. Range is the activity's range, or the token's movement.
 * - `moveAnimation`: moves the token through the chosen locations.
 * - `movementEffect`: effect applied to the user during the move and deleted after it.
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
            inputs: ['token', 'range', 'options'],
            label: 'CHRISPREMADES.Macros.Generic.MovementAnimation.SelectAnimation',
            hint: ''
        },
        moveAnimation: {
            default: {
                source: 'chris-premades',
                identifier: 'cunningActionDash'
            },
            type: 'selectAnimation',
            inputs: ['token', 'positions'],
            label: 'CHRISPREMADES.Macros.Generic.MovementAnimation.MoveAnimation',
            hint: ''
        },
        movementEffect: {
            default: '',
            type: 'selectEffect',
            label: 'CHRISPREMADES.Macros.Generic.MovementAnimation.MovementEffect',
            hint: ''
        }
    }
};