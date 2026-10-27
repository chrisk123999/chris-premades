import {actorUtils, compendiumUtils, dialogUtils, itemUtils, Logging} from '../../../../../proxy.mjs';
import {default as cpr} from '../../../../../constants.mjs';
const ids = [
    {id: 'form-of-the-beast-bite', translate: 'CHRISPREMADES.Macros.Legacy.FormOfTheBeast.Bite'},
    {id: 'form-of-the-beast-claws', translate: 'CHRISPREMADES.Macros.Legacy.FormOfTheBeast.Claws'},
    {id: 'form-of-the-beast-tail', translate: 'CHRISPREMADES.Macros.Legacy.FormOfTheBeast.Tail'}
];
async function beastForm({data, document: item, macroClass: {identifier, source}}) {
    const weapons = (await Promise.all(ids.map(async data => {
        const item = await compendiumUtils.getDocumentByIdentifier(cpr.packs.misc.automationItems, data.id, {object: true, translate: data.translate});
        if (item) item.id = item._id;
        return item;
    }))).filter(Boolean);
    if(weapons.length !== 3) return Logging.addMacroWarning(source, identifier, `Form of the Beast exited early due to missing pack items. (pack) ${cpr.packs.misc.automationItems} (identifiers) ${ids.join(', ')}`);
    const choice = await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.Legacy.FormOfTheBeast.Choose', weapons, {displayTooltips: true});
    if (!choice) return Logging.addMacroWarning(source, identifier, `Form of the Beast exited early due a declined weapon choice prompt. (actor) ${item.actor.uuid}`);
    if (actorUtils.getItemByIdentifier(item.actor, 'bestial-soul', {type: 'feat'})) {
        Logging.addMacroWarning(source, identifier, `Beastial Soul grants the magical property to Form of the Beast. (chosen weapon) ${choice.system.identifier}`);
        choice.system.properties.push('mgc');
        for (const activity of Object.values(choice.system.activities)) {
            if (activity.type !== 'attack') continue;
            choice.system.activities[activity._id].midiProperties.magicDamage = true;
        }
    }
    await itemUtils.createItems(item.actor, [choice], {favorite: true, parentEntity: data.effect});
}
export const formOfTheBeast = {
    name: 'Form of the Beast',
    version: '2.1.4',
    rules: '2014',
    called: [
        {
            pass: 'actorRageBegin',
            macro: beastForm,
            priority: 250
        }
    ]
};
