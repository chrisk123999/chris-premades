import {actorUtils, automationUtils, constants, dialogUtils, summonUtils, workflowUtils} from '../../proxy.mjs';
async function filterTargets({document: item, workflow}) {
    if (!workflow.targets.size) return;
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', 'targetCreatureTypes', configKeys);
    const summoner = config.excludeSummoner ? summonUtils.getSummonData(workflow.actor)?.owner : undefined;
    const chooseTargets = config.chooseTargets && workflow.activity.target?.template?.type;
    const maxSize = config.maxSize ? CONFIG.DND5E.actorSizes[config.maxSize]?.numerical : undefined;
    const invalid = Array.from(workflow.targets).filter(target => {
        if (!target.actor) return true;
        if (chooseTargets && target === workflow.token) return true;
        if (summoner && target.actor === summoner) return true;
        if (config.aliveOnly && target.actor.system.attributes.hp.value <= 0) return true;
        if (maxSize !== undefined && actorUtils.getSize(target.actor) > maxSize) return true;
        if (config.maxCR >= 0 && actorUtils.getLevelOrCR(target.actor) > config.maxCR) return true;
        if (config.minIntelligence && (target.actor.system.abilities.int?.value ?? 0) < config.minIntelligence) return true;
        if (!config.creatureTypes.length) return false;
        return config.creatureTypes.includes(actorUtils.typeOrRace(target.actor)) === config.invert;
    });
    if (invalid.length) await workflowUtils.removeTargets(workflow, invalid);
    if (!chooseTargets) return;
    const candidates = Array.from(workflow.targets);
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
 * - `maxSize`: remove targets larger than this size.
 * - `maxCR`: remove targets above this challenge rating. -1 skips the check.
 * - `minIntelligence`: remove targets with a lower Intelligence score. 0 skips the check.
 * - `chooseTargets`: for area activities, pick which of the remaining targets to keep. The user is always removed.
 * - `excludeSummoner`: remove the summoner of a summoned user.
 */
export const targetCreatureTypes = {
    rules: 'all',
    version: '2.1.3',
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
        maxSize: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSize',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.MaxSizeHint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.sizeOptions]; }
        },
        maxCR: {
            default: -1,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.MaxCR',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.MaxCRHint'
        },
        chooseTargets: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ChooseTargets',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ChooseTargetsHint'
        },
        minIntelligence: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.MinIntelligence',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.MinIntelligenceHint'
        },
        excludeSummoner: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ExcludeSummoner',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ExcludeSummonerHint'
        }
    }
};
const configKeys = Object.keys(targetCreatureTypes.genericConfig);
