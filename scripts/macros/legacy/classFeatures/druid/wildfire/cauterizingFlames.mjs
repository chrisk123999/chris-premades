import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, itemUtils, queryUtils, regionUtils, summonUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
const translations = 'CHRISPREMADES.Macros.Legacy.CauterizingFlames.';
async function died({document: item, effect}) {
    if (!effect.statuses.has('dead') || !item.system.uses.value) return;
    const actor = effect.parent;
    const token = actor instanceof Actor ? actorUtils.getFirstToken(actor) : undefined;
    const excludedSizes = automationUtils.getConfigValue(item, 'excludedSizes') ?? cauterizingFlames.config.excludedSizes.default;
    if (!token || excludedSizes.includes(actor.system.traits.size)) return;
    const sources = [actorUtils.getFirstToken(item.actor), ...summonUtils.getSummons(item.actor).filter(summon => summon.sourceItem && documentUtils.getIdentifier(summon.sourceItem) === 'summon-wildfire-spirit').map(summon => summon.token)].filter(source => source?.parent === token.parent);
    const range = automationUtils.getConfigValue(item, 'range') ?? cauterizingFlames.config.range.default;
    if (!sources.some(source => tokenUtils.isWithinDistance(source, token, range))) return;
    const size = token.parent.grid.size;
    const [region] = await documentUtils.createEmbeddedDocuments(token.parent, 'Region', [{
        name: item.name,
        color: '#ff7a00',
        shapes: [{type: 'rectangle', x: token.x, y: token.y, width: size * token.width, height: size * token.height}],
        flags: {
            cat: {macros: {region: [{source: 'chris-premades', rules: '2014', identifier: 'cauterizing-flames'}]}},
            'chris-premades': {cauterizingFlames: item.uuid}
        }
    }]) ?? [];
    const activity = itemUtils.getActivityByIdentifier(item, 'heal');
    if (region && activity) await regionUtils.addRegionTimer(activity, region, automationUtils.getConfigValue(item, 'rounds') ?? cauterizingFlames.config.rounds.default);
}
async function enter({document: region, tokens}) {
    const token = tokens?.[0];
    const item = fromUuidSync(region.flags['chris-premades']?.cauterizingFlames, {strict: false});
    if (!item?.actor || !token?.actor || token.actor.statuses.has('dead') || !item.system.uses.value || actorUtils.hasUsedReaction(item.actor)) return;
    const owner = actorUtils.getFirstToken(item.actor);
    if (!owner || !tokenUtils.canSee(owner, token)) return;
    const buttons = [['Heal', 'heal'], ['Damage', 'damage'], ['None', false]].map(([label, value]) => [_loc(translations + label), value]);
    const choice = await dialogUtils.buttonDialog(item.name, _loc(translations + 'Prompt', {name: token.name}), buttons, {userId: queryUtils.firstOwner(item.actor, true)});
    const activity = choice ? itemUtils.getActivityByIdentifier(item, choice) : undefined;
    if (!activity) return;
    await workflowUtils.completeActivityUse(activity, [token]);
    await documentUtils.deleteDocument(region);
}
export const cauterizingFlames = {
    name: 'Cauterizing Flames',
    version: '2.1.11',
    rules: '2014',
    effect: [
        {
            pass: 'sceneCreated',
            macro: died,
            priority: 50
        }
    ],
    region: [
        {
            pass: 'enter',
            macro: enter,
            priority: 50
        }
    ],
    config: {
        range: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        },
        excludedSizes: {
            default: ['tiny'],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.Legacy.CauterizingFlames.ExcludedSizes',
            category: 'homebrew',
            get options() { return constants.sizeOptions; }
        },
        rounds: {
            default: 10,
            type: 'number',
            label: 'CHRISPREMADES.Config.DurationRounds',
            category: 'homebrew'
        }
    }
};
