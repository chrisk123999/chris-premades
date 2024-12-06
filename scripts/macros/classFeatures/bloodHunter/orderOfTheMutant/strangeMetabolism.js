import {dialogUtils, effectUtils, genericUtils} from '../../../../utils.js';

async function use({workflow}) {
    let formulaList = [
        'Aether',
        'Alluring',
        'Celerity',
        'Conversant',
        'Cruelty',
        'Deftness',
        'Embers',
        'Gelid',
        'Impermeable',
        'Mobility',
        'Nighteye',
        'Percipient',
        'Potency',
        'Precision',
        'Rapidity',
        'Reconstruction',
        'Sagacity',
        'Shielded',
        'Unbreakable',
        'Vermillion'
    ];
    let negativeIdList = formulaList.map(i => 'formula' + i + 'Negative');
    let effects = negativeIdList.map(i => effectUtils.getEffectByIdentifier(workflow.actor, i)).filter(j => j);
    if (!effects.length) return;
    let selection;
    if (effects.length === 1) selection = effects[0];
    if (!selection) selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.StrangeMetabolism.Select', effects);
    if (!selection) return;
    await genericUtils.update(selection, {disabled: true, 'flags.chris-premades.effect.stayDisabled': true});
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60
        },
        flags: {
            'chris-premades': {
                strangeMetabolism: {
                    effectIdentifier: genericUtils.getIdentifier(selection)
                }
            }
        }
    };
    let positiveEffect = effectUtils.getEffectByIdentifier(workflow.actor, genericUtils.getIdentifier(selection)?.slice(0,-8));
    effectUtils.addMacro(effectData, 'effect', ['strangeMetabolism']);
    await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: positiveEffect});
}
async function end({trigger: {entity: effect}}) {
    let disabledEffect = effectUtils.getEffectByIdentifier(effect.parent, effect.flags['chris-premades']?.strangeMetabolism?.effectIdentifier);
    if (disabledEffect) await genericUtils.update(disabledEffect, {disabled: false, 'flags.chris-premades.effect.stayDisabled': false});
}
export let strangeMetabolism = {
    name: 'Strange Metabolism',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};