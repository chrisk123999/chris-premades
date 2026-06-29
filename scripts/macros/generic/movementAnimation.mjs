import {animationUtils, automationUtils, documentUtils, effectUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const {animation: selectLocationsAnimation, options: selectLocationsOptions} = automationUtils.getResolvedAnimation(document, 'selectLocationsAnimation', {source: 'chris-premades', identifier: 'movementAnimation'});
    if (!selectLocationsAnimation) return;
    const {animation: moveAnimation} = automationUtils.getResolvedAnimation(document, 'moveAnimation', {source: 'chris-premades', identifier: 'movementAnimation'});
    if (!moveAnimation) return;
    const range = workflow.actor.system.attributes.movement.max;
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
export const movementAnimation = {
    rules: 'all',
    version: '2.0.2',
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