import {Summons} from '../../lib/summons.js';
import {compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let spellLevel = workflow.castData.castLevel;
    let monsterCompendium = genericUtils.getCPRSetting('monsterCompendium');
    let compendiumDocs = await compendiumUtils.getFilteredDocumentsFromCompendium(monsterCompendium, {maxCR: spellLevel, actorTypes: ['npc'], creatureTypes: ['fey']});
    if (!compendiumDocs.length) {
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
    let sourceActor = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Summons.SelectSummon', compendiumDocs, {sortAlphabetical: true, sortCR: true, showCR: true, userId});
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'none';
    let updates = {
        token: {
            disposition: workflow.token.document.disposition
        }
    };
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 3600,
        range: 90,
        animation,
        concentrationNonDependent: true,
        onDeleteMacros: ['summonTurnHostile']
    });
}
export let conjureFey = {
    name: 'Conjure Fey',
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