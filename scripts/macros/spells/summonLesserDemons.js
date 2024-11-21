import {Summons} from '../../lib/summons.js';
import {animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, templateUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let monsterCompendium = genericUtils.getCPRSetting('monsterCompendium');
    let spellLevel = workflow.castData.castLevel;
    let summonsMultiplier = spellLevel > 7 ? 3 : (spellLevel > 5 ? 2 : 1);
    let typePl = genericUtils.translate('CHRISPREMADES.Macros.SummonLesserDemons.Demons');
    let roll = await new Roll('1d6').evaluate();
    let flavor;
    let maxCR;
    if (roll.total > 4) {
        maxCR = 1;
        flavor = genericUtils.format('CHRISPREMADES.Summons.CRSelection', {numSummons: summonsMultiplier * 2, typePl, cr: 1});
    } else if (roll.total > 2) {
        maxCR = 0.5;
        flavor = genericUtils.format('CHRISPREMADES.Summons.CRSelection', {numSummons: summonsMultiplier * 4, typePl, cr: '1/2'});
    } else {
        maxCR = 0.25;
        flavor = genericUtils.format('CHRISPREMADES.Summons.SelectSummons', {numSummons: summonsMultiplier * 8, typePl, cr: '1/4'});
    }
    roll.toMessage({
        rollMode: 'roll',
        speaker: workflow.chatCard.speaker,
        flavor
    });
    let compendiumDocs = await compendiumUtils.getFilteredActorDocumentsFromCompendium(monsterCompendium, {maxCR, actorTypes: ['npc'], creatureSubtypes: ['demon']});
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
    let sourceDocs = await dialogUtils.selectDocumentsDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Summons.SelectSummons', {totalSummons: summonsMultiplier * 2 / maxCR}), compendiumDocs, {max: summonsMultiplier * 2 / maxCR, sortAlphabetical: true, sortCR: true, showCR: true});
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
            disposition: -1
        }
    };
    await Summons.spawn(sourceActors, updates, workflow.item, workflow.token, {
        duration: 3600,
        range: 60,
        animation,
        initiativeType: 'group'
    });
    let drawTemplate = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.SummonLesserDemons.Draw');
    if (!drawTemplate) return;
    let templateData = {
        t: CONST.MEASURED_TEMPLATE_TYPES.CIRCLE,
        distance: 2.5 * workflow.token.document.width,
        x: workflow.token.center.x,
        y: workflow.token.center.y,
        borderColor: '#941010'
    };
    let [template] = await genericUtils.createEmbeddedDocuments(canvas.scene, 'MeasuredTemplate', [templateData]);
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'summonLesserDemons');
    effectUtils.addDependent(effect, [template]);
    if (!animationUtils.jb2aCheck()) return;
    new Sequence()
        .effect()
        .atLocation(template)
        .origin(template.uuid)
        .file('jb2a.extras.tmfx.runes.circle.simple.conjuration')
        .scale(0.2 * workflow.token.document.width)
        .tint('#941010')
        .persist(true)
        .belowTokens(true)
        .tieToDocuments(template)
        
        .effect()
        .atLocation(template)
        .origin(template.uuid)
        .file('jb2a.extras.tmfx.border.circle.simple.01')
        .scale(0.2 * workflow.token.document.width)
        .tint('#941010')
        .persist(true)
        .tieToDocuments(template)
        
        .play();

}
export let summonLesserDemons = {
    name: 'Summon Lesser Demons',
    version: '1.1.0',
    hasAnimation: true,
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
            default: 'fiend',
            category: 'animation',
            options: constants.summonAnimationOptions
        }
    ]
};