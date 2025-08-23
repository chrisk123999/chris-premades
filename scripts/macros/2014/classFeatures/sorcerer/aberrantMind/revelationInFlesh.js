import {dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.item.effects.contents.length) return;
    let sorceryPoints = itemUtils.getItemByIdentifier(workflow.actor, 'sorceryPoints');
    if (!sorceryPoints?.system?.uses?.value) return;
    let selection = await dialogUtils.selectDocumentsDialog(workflow.item.name, 'CHRISPREMADES.Macros.RevelationInFlesh.Select', workflow.item.effects.contents, {sortAlphabetical: true, max: sorceryPoints.system.uses.value, checkbox: true});
    if (!selection) return;
    let effects = selection.filter(i => i.amount).map(k => k.document);
    if (!effects.length) return;
    await genericUtils.update(sorceryPoints, {'system.uses.spent': sorceryPoints.system.uses.spent + effects.length});
    let effectData = genericUtils.duplicate(effects[0].toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    effectData.name = workflow.item.name;
    effects.forEach(effect => {
        let sourceEffectData = genericUtils.duplicate(effect.toObject());
        effectData.changes.push(...sourceEffectData.changes);
    });
    await effectUtils.createEffect(workflow.actor, effectData, {
        avatarImg: itemUtils.getConfig(workflow.item, 'avatarImg'),
        tokenImg: itemUtils.getConfig(workflow.item, 'tokenImg'),
        avatarImgPriority: itemUtils.getConfig(workflow.item, 'avatarImgPriority'),
        tokenImgPriority: itemUtils.getConfig(workflow.item, 'tokenImgPriority')
    });
}
export let revelationInFlesh = {
    name: 'Revelation in Flesh',
    version: '1.2.17',
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
            value: 'tokenImg',
            label: 'CHRISPREMADES.Config.TokenImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'tokenImgPriority',
            label: 'CHRISPREMADES.Config.TokenImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        },
        {
            value: 'avatarImg',
            label: 'CHRISPREMADES.Config.AvatarImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'avatarImgPriority',
            label: 'CHRISPREMADES.Config.AvatarImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        }
    ]
};