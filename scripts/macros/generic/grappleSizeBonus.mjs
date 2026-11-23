import {automationUtils} from '../../proxy.mjs';
function sizeCheck({document, data: {identifier}}) {
    const {sizeBonus, appliesTo} = automationUtils.getGenericConfigValues(document, 'chris-premades', 'grappleSizeBonus', ['sizeBonus', 'appliesTo']);
    if (appliesTo === 'grapple' && identifier !== 'grapple') return;
    if (appliesTo === 'shove' && !identifier.startsWith('shove')) return;
    return sizeBonus;
}
/**
 * Counts the actor as larger when checking which creatures it can grapple or shove.
 */
export const grappleSizeBonus = {
    rules: 'all',
    version: '2.1.11',
    category: 'mechanics',
    generic: true,
    documents: ['activeeffect', 'item'],
    grapple: [
        {
            pass: 'actorGrappleShoveSizeCheck',
            macro: sizeCheck,
            priority: 50
        }
    ],
    genericConfig: {
        sizeBonus: {
            default: 1,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.GrappleSizeBonus.SizeBonus.Label',
            hint: 'CHRISPREMADES.Macros.Generic.GrappleSizeBonus.SizeBonus.Hint'
        },
        appliesTo: {
            default: 'both',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.GrappleSizeBonus.AppliesTo.Label',
            hint: 'CHRISPREMADES.Macros.Generic.GrappleSizeBonus.AppliesTo.Hint',
            options: [
                {value: 'both', label: 'CHRISPREMADES.Macros.Generic.GrappleSizeBonus.AppliesTo.Both'},
                {value: 'grapple', label: 'CHRISPREMADES.Macros.Generic.ContestedCheck.Grapple'},
                {value: 'shove', label: 'CHRISPREMADES.Macros.Generic.GrappleSizeBonus.AppliesTo.Shove'}
            ]
        }
    }
};
