import {activityUtils, automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, effectUtils, folderUtils, itemUtils, Logging, summonUtils, workflowUtils} from '../../../proxy.mjs';
import {srdFamiliars} from '../../all/spells/findFamiliar.mjs';
async function summon({workflow}) {
    const identifier = documentUtils.getIdentifier(workflow.item);
    const familiars = summonUtils.getSummonsByIdentifier('find-familiar', {actor: workflow.actor});
    const total = automationUtils.getConfigValue(workflow.item, 'baseSummons') + workflowUtils.getCastLevel(workflow) - workflow.item.system.level - (familiars.length ? 1 : 0);
    if (total < 1) {
        Logging.addMacroWarning('CPR', identifier, 'No familiars to summon.');
        await effectUtils.endConcentration(workflow.actor, workflow.item);
        return;
    }
    const folder = automationUtils.getConfigValue(workflow.item, 'folder');
    const actors = folder ? await folderUtils.getActorsInFolder(folder) : await compendiumUtils.getDocumentsBySlug('dnd5e.monsters', srdFamiliars);
    if (!actors.length) {
        Logging.addMacroWarning('CPR', identifier, 'CHRISPREMADES.Macros.All.FindFamiliar.NoActors', {notify: 'warn', format: {folder}});
        await effectUtils.endConcentration(workflow.actor, workflow.item);
        return;
    }
    const selection = await dialogUtils.selectDocumentDialog(workflow.item.name, _loc('CHRISPREMADES.Summons.SelectSummons', {max: total}), actors, {max: total, combobox: true, sort: 'alphabetical'});
    const sourceActors = selection ? selection.flatMap(({document, amount}) => Array(amount).fill(document)) : [];
    if (!sourceActors.length) {
        Logging.addMacroWarning('CPR', identifier, 'No familiars selected.');
        await effectUtils.endConcentration(workflow.actor, workflow.item);
        return;
    }
    const creatureType = automationUtils.getConfigValue(workflow.item, 'creatureType') || familiars[0]?.actor?.system.details.type.value || await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Legacy.FlockOfFamiliars.Type', constants.spiritTypeOptions.map(option => [option.label, option.value, {image: option.image}]));
    if (!creatureType) {
        Logging.addMacroWarning('CPR', identifier, 'No creature type selected.');
        await effectUtils.endConcentration(workflow.actor, workflow.item);
        return;
    }
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const summons = [];
    for (const sourceActor of sourceActors) {
        const created = await summonUtils.createSummon(workflow.actor, sourceActor, {
            name: sourceActor.name,
            updates: {system: {details: {type: {value: creatureType}}}},
            animation: automationUtils.getConfigValue(workflow.item, creatureType + 'Animation'),
            disposition: workflow.token.document.disposition,
            duration: activityUtils.getDuration(workflow.activity),
            parent: concentrationEffect,
            sourceDocument: workflow.item,
            identifier,
            dismissAtZero: true
        });
        if (created) summons.push(created);
    }
    if (!summons.length) return;
    const effect = await itemUtils.unhideActivities(workflow.item, ['flock-of-familiars-touch'], {favorite: true});
    if (effect && concentrationEffect) await documentUtils.makeDependent(concentrationEffect, [effect]);
    await summonUtils.placeSummons(summons, automationUtils.getConfigValue(workflow.item, 'range'), {token: workflow.token.document});
}
export const flockOfFamiliars = {
    name: 'Flock of Familiars',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {pass: 'activityRollFinished', macro: summon, priority: 50}
    ],
    config: {
        folder: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Macros.All.FindFamiliar.Folder',
            category: 'summons'
        },
        creatureType: {
            default: '',
            type: 'select',
            label: 'CHRISPREMADES.Macros.All.FindFamiliar.CreatureType',
            hint: 'CHRISPREMADES.Macros.Legacy.FlockOfFamiliars.CreatureTypeHint',
            category: 'summons',
            get options() { return [{value: '', label: _loc('CHRISPREMADES.Macros.All.FindFamiliar.Ask')}, ...constants.spiritTypeOptions]; }
        },
        range: {
            default: 10,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'summons'
        },
        baseSummons: {
            default: 3,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.FlockOfFamiliars.BaseSummons',
            hint: 'CHRISPREMADES.Macros.Legacy.FlockOfFamiliars.BaseSummonsHint',
            category: 'homebrew'
        },
        touchRange: {
            default: 100,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.FindFamiliar.TouchRange',
            category: 'homebrew'
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
