import {DialogApp} from '../../../../applications/dialog.js';
import {constants, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier');
    let levels = workflow.actor.classes[classIdentifier]?.levels;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'forkedTongueEffect');
    let previousLanguages = [];
    if (effect) {
        previousLanguages = effect.changes.filter(change => change.key === 'system.traits.languages.value').map(change => change.value);
    }
    let knownLanguages = Array.from(workflow.actor.system.traits.languages.value).filter(i => !previousLanguages.includes(i));
    let selection = await DialogApp.dialog(workflow.item.name, 'CHRISPREMADES.Macros.ForkedTongue.SelectLanguages', [
        [
            'checkbox',
            constants.languageOptions().filter(i => !knownLanguages.includes(i.value)).map(i => ({
                label: i.label,
                name: i.value,
                options: {
                    isChecked: previousLanguages.includes(i.value)
                }
            })),
            {
                totalMax: levels >= 9 ? 3 : 2,
                displayAsRows: true
            }
        ]
    ], 'okCancel');
    if (!selection?.buttons) return;
    if (effect) await genericUtils.remove(effect);
    delete selection.buttons;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: Object.keys(selection).map(i => ({
            key: 'system.traits.languages.value',
            value: i,
            mode: 2,
            priority: 20
        }))
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'forkedTongueEffect'
    });
}
export let forkedTongue = {
    name: 'Forked Tongue',
    version: '1.3.65',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'illrigger',
            category: 'homebrew',
            homebrew: true
        }
    ]
};