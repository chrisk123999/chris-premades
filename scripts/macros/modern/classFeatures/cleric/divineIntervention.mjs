import {automationUtils, compendiumUtils, constants, itemUtils, workflowUtils} from '../../../../proxy.mjs';
async function use({workflow}) {
    const config = automationUtils.getConfigValues(workflow.item, ['classIdentifier', 'maxLevel']);
    const additional = await automationUtils.calledEvent('divineIntervention', workflow.actor, {
        multiResult: true,
        canOverlap: true,
        data: {workflow, ...config}
    });
    const additionalMap = new Map();
    const exceptions = additional?.filter(a => a?.identifier).map(a => {
        if (a.source) {
            if (!additionalMap.has(a.identifier)) additionalMap.set(a.identifier, [a.source]);
            else additionalMap.get(a.identifier).push(a.source);
        }
        return a.identifier;
    });
    const choice = await compendiumUtils.getSpellFromLists([`class:${config.classIdentifier}`], {
        filters: [{o: 'NOT', v: {k: 'system.activation.type', o: 'exact', v: 'reaction'}}],
        maxLevel: config.maxLevel,
        title: workflow.item.name,
        icon: workflow.item.img,
        exceptions
    });
    if (!choice || !choice.length) return;
    const usedAdditional = additionalMap.get(choice[0].system.identifier);
    if (usedAdditional) await Promise.all(usedAdditional.map(a => {
        if (a.documentName === 'Activity')
            return workflowUtils.syntheticActivityRoll(a);
        else if (a.documentName === 'Item')
            return workflowUtils.syntheticItemRoll(a);
    }));
    const itemData = choice[0].toObject();
    itemData.system.properties = itemData.system.properties.filter(i => i != 'material');
    itemData.system.materials = {
        value: '',
        consumed: false,
        cost: 0,
        supply: 0
    };
    itemData.system.method = 'innate';
    itemData.system.activation.type = 'special';
    const item = itemUtils.syntheticItem(itemData, workflow.actor);
    await workflowUtils.completeItemUse(item, undefined, {consumeResources: false, consumeUsage: false, spellSlot: false});
}
export const divineIntervention = {
    name: 'Divine Intervention',
    version: '2.0.3',
    rules: '2024',
    notes: 'Use the "actorDivineIntervention" called event (async) to provide additional spells. Return {source, identifier}, where source is the granting item and will be rolled if the spell is used.\n\tData available: classIdentifier, maxLevel, workflow.',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        classIdentifier: {
            default: 'cleric',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        },
        maxLevel: {
            default: '5',
            type: 'select',
            label: 'CHRISPREMADES.Config.MaxLevel',
            category: 'behavior',
            get options() { return constants.spellSlotOptions(); }
        }
    }
};
