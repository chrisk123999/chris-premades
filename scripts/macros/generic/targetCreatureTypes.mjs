import {actorUtils, automationUtils, constants, dialogUtils, workflowUtils} from '../../proxy.mjs';
async function filterTargets({document: item, workflow}) {
    if (!workflow.targets.size) return;
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', 'targetCreatureTypes', configKeys);
    const invalid = Array.from(workflow.targets).filter(target => {
        if (!target.actor) return true;
        if (config.aliveOnly && target.actor.system.attributes.hp.value <= 0) return true;
        if (!config.creatureTypes.length) return false;
        return config.creatureTypes.includes(actorUtils.typeOrRace(target.actor)) === config.invert;
    });
    if (invalid.length) await workflowUtils.removeTargets(workflow, invalid);
    if (!config.chooseTargets || !workflow.activity.target?.template?.type) return;
    const candidates = Array.from(workflow.targets).filter(token => token !== workflow.token);
    if (!candidates.length) return;
    const selection = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ChooseTargetsSelect', candidates, {type: 'multiple', maxAmount: candidates.length, skipDeadAndUnconscious: false});
    await workflowUtils.updateTargets(workflow, selection?.result ?? []);
}
/**
 * Removes targets that do not match the configured creature types.
 * Bound on an item. Fires on `itemPreambleComplete`.
 * Targets without an actor are always removed.
 *
 * Config:
 * - `creatureTypes`: keep only targets of these creature types. Leave empty to skip the creature type check.
 * - `invert`: remove targets of the selected creature types instead of keeping them.
 * - `aliveOnly`: remove targets at 0 hit points.
 * - `chooseTargets`: for area activities, pick which of the remaining targets to keep.
 */
export const targetCreatureTypes = {
    rules: 'all',
    version: '2.0.4',
    category: 'targeting',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: filterTargets,
            priority: 50
        }
    ],
    genericConfig: {
        creatureTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.CreatureTypesHint',
            get options() { return constants.creatureTypeOptions; }
        },
        invert: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.Invert',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.InvertHint'
        },
        aliveOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.AliveOnly',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.AliveOnlyHint'
        },
        chooseTargets: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ChooseTargets',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ChooseTargetsHint'
        }
    }
};
const configKeys = Object.keys(targetCreatureTypes.genericConfig);
