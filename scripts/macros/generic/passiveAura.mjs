import {actorUtils, automationUtils, constants} from '../../proxy.mjs';
async function aura({document, actor, identifier}) {
    if (actorUtils.getEffectByIdentifier(actor, identifier + 'Aura')) return;
    const includeSelf = automationUtils.getGenericConfigValue(document, 'chris-premades', 'passiveAura', 'includeSelf');
    if (!includeSelf && actor.id === document.actor.id) return;
    const effectId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'passiveAura', 'effect');
    const sourceEffect = document.effects.get(effectId);
    if (!sourceEffect) return;
    return {effectData: sourceEffect.toObject()};
}
export const passiveAura = {
    rules: 'all',
    version: '2.0.3',
    category: 'mechanics',
    generic: true,
    documents: ['item'],
    aura: [
        {
            pass: 'update',
            macro: aura,
            priority: 100,
            configDistance: 'distance',
            configDispositions: 'dispositions',
            configDisabled: 'disableConditions',
            configSelfDisable: 'selfDisableConditions'
        }
    ],
    genericConfig: {
        distance: {
            default: '30',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Distance'
        },
        dispositions: {
            default: ['ally'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Dispositions',
            get options() {return constants.dispositionOptions;}
        },
        disableConditions: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DisableConditions',
            get options() {return constants.statusOptions;}
        },
        selfDisableConditions: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SelfDisableConditions',
            get options() {return constants.statusOptions;}
        },
        includeSelf: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.IncludeSelf'
        },
        effect: {
            default: '',
            type: 'selectEffect',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Effect'
        }
    }
};