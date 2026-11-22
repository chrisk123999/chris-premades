import {activityUtils, automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, folderUtils, itemUtils, Logging, summonUtils} from '../../../proxy.mjs';
export const srdFamiliars = ['bat', 'cat', 'crab', 'frog', 'hawk', 'lizard', 'octopus', 'owl', 'poisonous-snake', 'quipper', 'rat', 'raven', 'sea-horse', 'spider', 'weasel'];
async function preventRecast({document: activity}) {
    if (!summonUtils.getSummonsBySource(activity.item).length) return;
    Logging.addMacroWarning('CPR', documentUtils.getIdentifier(activity.item), 'A familiar is already summoned.');
    return true;
}
async function summon({workflow}) {
    const identifier = documentUtils.getIdentifier(workflow.item);
    const folder = automationUtils.getConfigValue(workflow.item, 'folder');
    const actors = folder ? await folderUtils.getActorsInFolder(folder) : await compendiumUtils.getDocumentsBySlug('dnd5e.monsters', srdFamiliars);
    if (!actors.length) {
        Logging.addMacroWarning('CPR', identifier, 'CHRISPREMADES.Macros.All.FindFamiliar.NoActors', {notify: 'warn', format: {folder}});
        return;
    }
    const sourceActor = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.All.FindFamiliar.Choose', actors, {sort: 'alphabetical'});
    if (!sourceActor) return;
    const creatureType = automationUtils.getConfigValue(workflow.item, 'creatureType') || await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.All.FindFamiliar.Type', constants.spiritTypeOptions.map(option => [option.label, option.value, {image: option.image}]));
    if (!creatureType) return;
    const name = automationUtils.getConfigValue(workflow.item, 'name') || sourceActor.name;
    const updates = {system: {details: {type: {value: creatureType}}}};
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {
        name,
        updates,
        animation: automationUtils.getConfigValue(workflow.item, creatureType + 'Animation'),
        disposition: workflow.token.document.disposition,
        sourceDocument: workflow.item,
        identifier,
        dismissAtZero: true
    });
    if (!summon) return;
    const effect = await itemUtils.unhideActivities(workflow.item, ['find-familiar-pocket-dimension', 'find-familiar-touch', 'find-familiar-place'], {favorite: true});
    await documentUtils.makeDependent(summon.actor, [effect]);
    await summon.place(activityUtils.getRange(workflow.activity), {token: workflow.token.document});
}
async function pocket({workflow}) {
    const summons = summonUtils.getSummonsBySource(workflow.item);
    if (!summons.length) return Logging.addMacroWarning('CPR', 'find-familiar-pocket', 'No familiar summoned.');
    if (summons.find(i => i.token)) {
        await summonUtils.recallAllSourceSummons(workflow.item);
    } else {
        await summonUtils.placeAllSourceSummons(workflow.item, activityUtils.getRange(workflow.activity), {token: workflow.token.document});
    }
}
export const findFamiliar = {
    name: 'Find Familiar',
    version: '2.1.10',
    rules: 'all',
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: preventRecast,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: summon,
            priority: 50
        }
    ],
    config: {
        name: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Config.CustomName',
            category: 'summons'
        },
        folder: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Macros.All.FindFamiliar.Folder',
            category: 'summons'
        },
        creatureType: {
            default: '',
            type: 'select',
            label: 'CHRISPREMADES.Macros.All.FindFamiliar.CreatureType.Label',
            hint: 'CHRISPREMADES.Macros.All.FindFamiliar.CreatureType.Hint',
            category: 'summons',
            get options() { return [{value: '', label: 'CHRISPREMADES.Macros.All.FindFamiliar.Ask'}, ...constants.spiritTypeOptions]; }
        },
        celestialAnimation: {
            default: {source: 'chris-premades', identifier: 'celestialSummon'},
            type: 'selectAnimation',
            inputs: ['summon', 'location', 'token'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        },
        feyAnimation: {
            default: {source: 'chris-premades', identifier: 'natureSummon'},
            type: 'selectAnimation',
            inputs: ['summon', 'location', 'token'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        },
        fiendAnimation: {
            default: {source: 'chris-premades', identifier: 'fiendSummon'},
            type: 'selectAnimation',
            inputs: ['summon', 'location', 'token'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
export const findFamiliarPocket = {
    name: 'Find Familiar: Pocket',
    version: findFamiliar.version,
    rules: 'all',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: pocket,
            priority: 50
        }
    ]
};
