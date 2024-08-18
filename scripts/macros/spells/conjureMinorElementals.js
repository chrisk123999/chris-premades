import {Summons} from '../../lib/summons.js';
import {compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let monsterCompendium = genericUtils.getCPRSetting('monsterCompendium');
    let totalSummons = Math.floor((workflow.castData.castLevel - 2) / 2);
    let typePl = genericUtils.translate('DND5E.CreatureElementalPl');
    let optionButtons = [
        [genericUtils.format('CHRISPREMADES.Summons.CRSelection', {numSummons: totalSummons, typePl, cr: 2}), 2],
        [genericUtils.format('CHRISPREMADES.Summons.CRSelection', {numSummons: totalSummons * 2, typePl, cr: 1}), 1],
        [genericUtils.format('CHRISPREMADES.Summons.CRSelection', {numSummons: totalSummons * 4, typePl, cr: '1/2'}), 0.5],
        [genericUtils.format('CHRISPREMADES.Summons.CRSelection', {numSummons: totalSummons * 8, typePl, cr: '1/4'}), 0.25]
    ];
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Summons.HowMany', optionButtons);
    if (!selection) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let compendiumDocs = await compendiumUtils.getFilteredDocumentsFromCompendium(monsterCompendium, {maxCR: selection, actorTypes: ['npc'], creatureTypes: ['elemental']});
    if (!compendiumDocs?.length) {
        genericUtils.notify('CHRISPREMADES.Summons.NoMatching', 'info');
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let userId = socketUtils.gmID();
    if (genericUtils.getCPRSetting('playerSelectsConjures')) userId = game.userId;
    if (!userId) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let sourceDocs = await dialogUtils.selectDocumentsDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Summons.SelectSummons', {totalSummons: totalSummons * 2 / selection}), compendiumDocs, {max: totalSummons * 2 / selection, sortAlphabetical: true, sortCR: true});
    if (sourceDocs?.length) sourceDocs = sourceDocs?.filter(i => i.amount);
    if (!sourceDocs?.length) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let sourceActors = await Promise.all(sourceDocs.map(async i => {
        return {
            document: await fromUuid(i.document.uuid),
            amount: i.amount
        };
    }));
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'none';
    let updates = {
        token: {
            disposition: workflow.token.document.disposition
        }
    };
    await Summons.spawn(sourceActors, updates, workflow.item, workflow.token, {
        duration: 3600,
        range: 90,
        animation,
        initiativeType: 'group'
    });
}
export let conjureMinorElementals = {
    name: 'Conjure Minor Elementals',
    version: '0.12.12',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'default',
            category: 'animation',
            options: constants.summonAnimationOptions
        }
    ]
};