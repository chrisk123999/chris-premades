import {activityUtils, automationUtils, compendiumUtils, dataUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
import {cpr} from '../../../../../module.mjs';
async function cook({macroClass: {identifier, source}, workflow}) {
    const meal = await compendiumUtils.getDocumentByIdentifier(cpr.packs.misc.automationItems, 'magnificent-feast', {
        object: true, translate: 'CHRISPREMADES.Macros.Legacy.MagnificentFeast.Name', description: workflow.item.system.description.value
    });
    if (!meal) return Logging.addMacroWarning(source, identifier, `Magnificent Feat could not locate its pack item! (activity) ${workflow.activity.uuid} (pack) ${cpr.packs.misc.automationItems} (item identifier) magnificent-feast`);
    const config = automationUtils.getConfigValues(workflow.item, ['formula', 'mealTypes', 'targets']);
    config.targets = dnd5e.utils.replaceFormulaData(config.targets, dataUtils.getFormulaData({workflow}), {item: workflow.item, property: _loc('DND5E.TARGET.FIELDS.target.affects.count.label')});
    const maxAmount = (await rollUtils.rollDice(config.targets, {workflow}))?.total;
    const selection = await dialogUtils.selectTargetDialog(
        workflow.item.name,
        _loc('CHRISPREMADES.Macros.Legacy.MagnificentFeast.Prompt', {maxAmount}),
        workflow.targets.documents,
        {type: 'selectAmount', maxAmount, skipDeadAndUnconscious: false}
    );
    if (!selection?.result?.length) return workflow.aborted = true;
    await workflowUtils.updateTargets(workflow, selection.result.map(t => t.document));
    config.formula = dnd5e.utils.replaceFormulaData(config.formula, dataUtils.getFormulaData({workflow}), {item: workflow.item, property: _loc('CAT.Macros.Summon.HealingBonus')});
    for (const id of Object.keys(meal.system.activities)) {
        const activity = meal.system.activities[id];
        if (activity?.type !== 'heal') continue;
        activity.healing.custom = {enabled: true, formula: config.formula};
    }
    const effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: activityUtils.getEffectDuration(workflow.activity)
    };
    genericUtils.setProperty(effectData, 'flags.dae.specialDuration', ['longRest', 'shortRest']);
    genericUtils.setProperty(effectData, 'flags.dae.expiryMode', 'delete');
    dataUtils.setOrigin(effectData, workflow.activity);
    await automationUtils.calledEvent('preCreateMagnificentFeast', workflow.actor, {canOverlap: true, data: {workflow, itemData: meal}});
    await Promise.all(selection.result.map(async t => {
        if (!t.document?.actor) return;
        const parentEntity = (await effectUtils.createEffects(t.document.actor, [effectData]))?.[0];
        if (!parentEntity) return;
        genericUtils.setProperty(meal, 'system.quantity', t.value);
        const item = (await itemUtils.createItems(t.document.actor, [meal], {parentEntity}))?.[0];
        if (item) await documentUtils.makeDependent(item, [parentEntity]);
        return item;
    }));
}
export const magnificentFeast = {
    name: 'Magnificent Feast',
    version: '2.1.11',
    rules: '2014',
    notes: 'Use the "actorPreCreateMagnificentFeast" called event (async) to modify the food item.\n\tData available: itemData, workflow.',
    roll: [
        {
            pass: 'activityTargeting',
            macro: cook,
            priority: 50
        }
    ],
    config: {
        formula: {
            default: '2d4 + @classes.cleric.levels',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula'
        },
        targets: {
            default: '@scale.community.magnificent-feast',
            type: 'formula',
            category: 'behavior',
            label: 'DND5E.TARGET.FIELDS.target.affects.count.label'
        },
        mealTypes: {
            default: '',
            type: 'file',
            fileType: 'image',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.MagnificentFeast.Meals'
        },
        subclassIdentifier: {
            default: 'community',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SubclassIdentifier'
        }
    },
    scales: [
        {
            identifier: 'magnificent-feast',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'magnificent-feast',
                    type: 'string',
                    scale: {
                        2: {value: 'max(1, @abilities.wis.mod)'},
                        17: {value: '2 * max(1, @abilities.wis.mod)'}
                    }
                },
                title: 'Magnificent Feast'
            }
        }
    ]
};
