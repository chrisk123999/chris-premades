import {cpr} from '../../../../../module.mjs';
import {actorUtils, automationUtils, compendiumUtils, dialogUtils, documentUtils, genericUtils, itemUtils, Logging, rollUtils} from '../../../../../proxy.mjs';
const types = ['healing', 'swiftness', 'resilience', 'boldness', 'flight', 'transformation'];
const label = type => 'CHRISPREMADES.Macros.Legacy.ExperimentalElixir.' + type.capitalize();
function getElixirs(actor) {
    return actor.items.filter(item => item.flags['chris-premades']?.experimentalElixir);
}
async function addElixir(actor, type) {
    const existing = getElixirs(actor).find(item => item.flags['chris-premades'].experimentalElixir === type);
    if (existing) return await documentUtils.update(existing, {'system.quantity': existing.system.quantity + 1});
    const itemData = await compendiumUtils.getDocumentByIdentifier(cpr.packs.misc.automationItems, 'experimental-elixir-' + type, {object: true, translate: label(type)});
    if (!itemData) return Logging.addMacroWarning('chris-premades', 'experimental-elixir', 'Elixir missing from pack. (type) ' + type, {notify: 'warn'});
    const intMod = actor.system.abilities.int.mod;
    const activities = Object.values(itemData.system.activities);
    const drink = activities.find(activity => activity.midiProperties?.identifier === 'drink');
    const reagents = activities.find(activity => activity.midiProperties?.identifier === 'reagents');
    if (type === 'healing') drink.healing.bonus = String(intMod);
    if (reagents && actorUtils.getItemByIdentifier(actor, 'restorative-reagents')) {
        reagents.healing.bonus = String(intMod);
        genericUtils.setProperty(drink, 'midiProperties.triggeredActivityId', reagents._id);
        genericUtils.setProperty(drink, 'midiProperties.triggeredActivityTargets', 'targets');
    }
    genericUtils.setProperty(itemData, 'flags.chris-premades.experimentalElixir', type);
    await itemUtils.createItems(actor, [itemData]);
}
async function rest({document: item, workflow}) {
    const actor = workflow.actor;
    const count = (await rollUtils.rollDice(automationUtils.getConfigValue(item, 'count'), {document: item})).total;
    const choose = automationUtils.getConfigValue(item, 'choose');
    for (let i = 0; i < count; i++) {
        if (choose) {
            await slot({document: item, workflow});
            continue;
        }
        const {roll} = await rollUtils.rollDice('1d6', {message: true, flavor: item.name, speaker: ChatMessage.implementation.getSpeaker({actor})});
        await addElixir(actor, types[roll.total - 1]);
    }
}
async function slot({document: item, workflow}) {
    const type = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Legacy.ExperimentalElixir.Choose', types.map(type => [label(type), type]));
    if (type) await addElixir(workflow.actor, type);
}
async function expire({actor}) {
    await Promise.all(getElixirs(actor).map(elixir => documentUtils.deleteDocument(elixir)));
}
async function use({document: item, workflow}) {
    if (workflow.activity.identifier === 'rest') return await rest({document: item, workflow});
    if (workflow.activity.identifier === 'slot') return await slot({document: item, workflow});
}
async function drink({workflow}) {
    if (workflow.activity.identifier !== 'drink') return;
    const target = workflow.targets.first()?.actor;
    if (!target || target === workflow.actor || target.statuses.has('incapacitated')) return;
    genericUtils.notify('CHRISPREMADES.Macros.Legacy.ExperimentalElixir.Administer', {type: 'warn'});
    workflow.aborted = true;
    return true;
}
export const experimentalElixir = {
    name: 'Experimental Elixir',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    rest: [
        {
            pass: 'actorLong',
            macro: expire,
            priority: 10
        }
    ],
    config: {
        count: {
            default: '1 + min(1, floor(@classes.artificer.levels / 6)) + min(1, floor(@classes.artificer.levels / 15))',
            type: 'formula',
            label: 'CHRISPREMADES.Macros.Legacy.ExperimentalElixir.Count',
            category: 'homebrew'
        },
        choose: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Legacy.ExperimentalElixir.ChooseType',
            category: 'homebrew'
        }
    }
};
export const experimentalElixirDrink = {
    name: 'Experimental Elixir: Drink',
    version: experimentalElixir.version,
    rules: '2014',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: drink,
            priority: 50
        }
    ]
};
