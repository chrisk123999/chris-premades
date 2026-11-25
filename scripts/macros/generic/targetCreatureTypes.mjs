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
        if (config.canSee && target.object && workflow.token && !tokenUtils.canSee(workflow.token.document, target)) return true;
        if (!config.creatureTypes.length) return false;
        return config.creatureTypes.includes(actorUtils.typeOrRace(target.actor)) === config.invert;
    });
    if (invalid.length) {
        const counter = {value: 1};
        const hide = game.settings.get('cat', 'hideNames');
        const names = `<ul>${invalid.map(t =>
            `<li>${dialogUtils.getTokenName(t, {hide, counter})}</li>`
        ).join('')}</ul>`;
        await workflowUtils.removeTargets(workflow, invalid);
        await MidiQOL.addCardNote(workflow, `<b>${_loc('CHRISPREMADES.Macros.Generic.TargetCreatureTypes.Unaffected')}</b>` + names);
    }
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
            prompt = _loc('CHRISPREMADES.Macros.Generic.TargetCreatureTypes.SelectTargets', {maxAmount: config.limit});
            type = 'multiple';
            break;
    }
    if (type === 'multiple') preselected = Object.fromEntries(candidates.map((t, i) => [t.id, i < maxAmount]));
    const selection = await dialogUtils.selectTargetDialog((document.item ?? document).name, prompt, candidates, {preselected, type, maxAmount, skipDeadAndUnconscious: false});
    if (!selection?.result) return workflow.aborted = true;
    if (type === 'one') {
        await workflowUtils.updateTargets(workflow, [selection.result]);
        return;
    }
    await workflowUtils.updateTargets(workflow, selection.result?.length ? selection.result : candidates.slice(0, maxAmount));
}
/**
 * Removes targets that fail the configured filters before the activity rolls, such as creature type, size or challenge
 * rating. Targets without an actor are always removed. When set on an item, it filters every activity of the item.
 * Cancelling the target prompt cancels the activity.
 */
export const targetCreatureTypes = {
    rules: 'all',
    version: '2.1.11',
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
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.CreatureTypes.Hint',
            get options() { return constants.creatureTypeOptions; }
        },
        invert: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.Invert.Label',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.Invert.Hint'
        },
        aliveOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.AliveOnly.Label',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.AliveOnly.Hint'
        },
        maxSize: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSize',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.MaxSize.Hint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.sizeOptions]; }
        },
        maxCR: {
            default: -1,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.MaxCR.Label',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.MaxCR.Hint'
        },
        chooseTargets: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ChooseTargets.Label',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ChooseTargets.Hint'
        },
        excludeSelf: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ExcludeSelf.Label',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ExcludeSelf.Hint'
        },
        limit: {
            default: '',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.Limit.Label',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.Limit.Hint'
        },
        canSee: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.CanSee.Label',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.CanSee.Hint'
        },
        minIntelligence: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.MinIntelligence.Label',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.MinIntelligence.Hint'
        },
        excludeSummoner: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ExcludeSummoner.Label',
            hint: 'CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ExcludeSummoner.Hint'
        }
    }
};
const configKeys = Object.keys(targetCreatureTypes.genericConfig);
