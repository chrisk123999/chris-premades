import {activityUtils, combatUtils, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size || !workflow.activity) return;
    let options = Object.entries(CONFIG.DND5E.skills).map(([key, value]) => ({
        name: value.label,
        id: key,
        img: value.icon
    }));
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectASkill', options);
    if (!selection) return;
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.changes[0].key = effectData.changes[0].key.replaceAll('acr', selection.id);
    effectData.origin = sourceEffect.uuid,
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    effectData.changes[0].value = '+ ' + formula;
    effectData.img = options.find(i => i.id === selection.id)?.img ?? sourceEffect.img;
    await Promise.all(workflow.targets.map(async token => {
        await effectUtils.createEffect(token.actor, effectData, {concentrationItem: workflow.item});
    }));
}
async function skillCheck({trigger: {actor, entity: item, roll, token}}) {
    let prompt = itemUtils.getConfig(item, 'promptToUse');
    if (prompt === 'never') return;
    if (combatUtils.inCombat()) return;
    let effect = effectUtils.getEffectByIdentifier(actor, 'guidanceEffect');
    if (effect) return;
    if (prompt === 'prompt') {
        let selection = await dialogUtils.confirmUseItem(item);
        if (!selection) return;
    }
    let activity = activityUtils.getActivityByIdentifier(item, 'selfUse', {strict: true});
    await workflowUtils.syntheticActivityRoll(activity, [token], {consumeResources: true, consumeUsage: true});
    let formula = itemUtils.getConfig(item, 'formula');
    return await rollUtils.addToRoll(roll, '+ ' + formula);
}
export let guidance = {
    name: 'Guidance',
    version: '1.3.78',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            }
        ]
    },
    skill: [
        {
            pass: 'bonus',
            macro: skillCheck,
            priority: 50
        }
    ],
    config: [
        {
            value: 'promptToUse',
            label: 'CHRISPREMADES.Config.PromptToUse',
            type: 'select',
            default: 'prompt',
            category: 'mechanics',
            options: [
                {
                    label: 'CHRISPREMADES.Generic.Never',
                    value: 'never'
                },
                {
                    label: 'CHRISPREMADES.Generic.Prompt',
                    value: 'prompt'
                },
                {
                    label: 'CHRISPREMADES.Generic.Automatic',
                    value: 'auto'
                }
            ]
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '1d4',
            category: 'homebrew',
            homebrew: true
        }
    ]
};