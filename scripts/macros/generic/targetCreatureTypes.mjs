import {actorUtils, automationUtils, constants, dialogUtils, rollUtils, summonUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function filterTargets({document, workflow}) {
    if (document.item && workflow.activity.uuid !== document.uuid) return;
    if (!workflow.targets.count) return;
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'targetCreatureTypes', configKeys);
    const summoner = config.excludeSummoner ? summonUtils.getSummonData(workflow.actor)?.owner : undefined;
    const maxSize = config.maxSize ? CONFIG.DND5E.actorSizes[config.maxSize]?.numerical : undefined;
    const invalid = workflow.targets.documents.filter(target => {
        if (!target.actor) return true;
        if (config.excludeSelf && target.id === workflow.token?.id) return true;
        if (summoner && target.actor === summoner) return true;
        if (config.aliveOnly && target.actor.system.attributes.hp.value <= 0) return true;
        if (maxSize !== undefined && actorUtils.getSize(target.actor) > maxSize) return true;
        if (config.maxCR >= 0 && actorUtils.getLevelOrCR(target.actor) > config.maxCR) return true;
        if (config.minIntelligence && (target.actor.system.abilities.int?.value ?? 0) < config.minIntelligence) return true;
        if (config.canSee && target.object && !tokenUtils.canSee(workflow.token.document, target)) return true;
        if (!config.creatureTypes.length) return false;
        return config.creatureTypes.includes(actorUtils.typeOrRace(target.actor)) === config.invert;
    });
    if (invalid.length) await workflowUtils.removeTargets(workflow, invalid);
    const candidates = workflow.targets.documents;
    if (!candidates.length) return;
    if (config.limit) config.limit = (await rollUtils.rollDice(config.limit, {workflow}))?.total;
    if ((!config.chooseTargets || !workflow.activity.target?.template?.type) && (!config.limit || candidates.length <= config.limit)) return;
    let maxAmount = config.limit || candidates.length, preselected, prompt, type;
    switch (config.limit) {
        case 1:
            prompt = 'CHRISPREMADES.Generic.SelectTarget';
            type = 'one';
            break;
        case 0:
        case '':
        case null:
        case undefined:
        case candidates.length:
            prompt = 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ChooseTargetsSelect';
            type = 'multiple';
            break;
        default:
            prompt = _loc('CHRISPREMADES.Generic.SelectTargets', {maxAmount: config.limit});
            type = 'multiple';
            break;
    }
    if (type === 'multiple') preselected = candidates.reduce((obj, t) => (obj[t.id] = obj.count++ < maxAmount, obj), {count: 0});
    const selection = await dialogUtils.selectTargetDialog((document.item ?? document).name, prompt, candidates, {preselected, type, maxAmount, skipDeadAndUnconscious: false});
    if (!selection?.result) return workflow.aborted = true;
    if (type === 'one') return await workflowUtils.updateTargets(workflow, [selection.result]);
    await workflowUtils.updateTargets(workflow, selection.result?.length ? selection.result : candidates.slice(0, maxAmount));
}
/**
 * Removes targets that do not match the configured creature types.
 * Bound on an item. Fires on `itemTargeting`.
 * Targets without an actor are always removed.
 *
 * Config:
 * - `creatureTypes`: keep only targets of these creature types. Leave empty to skip the creature type check.
 * - `invert`: remove targets of the selected creature types instead of keeping them.
 * - `aliveOnly`: remove targets at 0 hit points.
 * - `maxSize`: remove targets larger than this size.
 * - `maxCR`: remove targets above this challenge rating. -1 skips the check.
 * - `minIntelligence`: remove targets with a lower Intelligence score. 0 skips the check.
 * - `chooseTargets`: for area activities, pick which of the remaining targets to keep.
 * - `excludeSelf`: for area activities with `chooseTargets`, the user is always removed.
 * - `limit`: prompt which targets to keep if the filtered list includes more than this limit.
 * - `canSee`: remove targets that cannot be seen by the attacker.
 * - `excludeSummoner`: remove the summoner of a summoned user.
 */
export const targetCreatureTypes = {
    rules: 'all',
    version: '2.1.3',
    category: 'targeting',
    generic: true,
    documents: ['activity', 'item'],
    roll: [
        {
            pass: 'itemTargeting',
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
        excludeSelf: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ExcludeSelf',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ExcludeSelfHint'
        },
        limit: {
            default: '',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.MaxTargets',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.LimitHint'
        },
        canSee: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.CanSee',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.CanSeeHint'
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
