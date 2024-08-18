import {Summons} from '../lib/summons.js';
import {summonEffects} from '../macros/animations/summonEffects.js';
import {actorUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../utils.js';
async function doSummon(event, uuid) {
    let dialogApp = Object.values(ui.windows).find(i => i.title === 'spotlight-omnisearch.spotlight.title');
    if (dialogApp) dialogApp.close();
    let selectedToken = canvas.tokens.controlled[0];
    if (!selectedToken) {
        genericUtils.notify('CHRISPREMADES.SpotlightOmnisearch.Token', 'warn');
        buttonMap = {};
        return;
    }
    if (!selectedToken.actor) {
        genericUtils.notify('CHRISPREMADES.SpotlightOmnisearch.Actor', 'warn');
        buttonMap = {};
        return;
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.miscellaneousItems, 'Spotlight Omnisearch Summon', {object: true});
    if (!featureData) {
        errors.missingPackItem(constants.packs.miscellaneousItems, 'Spotlight Omnisearch Summon');
        return;
    }
    let actor = await fromUuid(uuid);
    if (!actor) return;
    let savedId = actor.id;
    let animation = genericUtils.getProperty(buttonMap, savedId + '.ani') ?? 0;
    let duration = genericUtils.getProperty(buttonMap, savedId + '.dur') ?? 60;
    genericUtils.setProperty(featureData, 'flags.chris-premades.spotlightOmnisearch', {
        uuid: uuid,
        duration: duration,
        animation: Object.keys(summonEffects)[animation]
    });
    let concentration = genericUtils.getProperty(buttonMap, savedId + '.con') ?? false;
    if (concentration) {
        featureData.system.properties.push('concentration');
        featureData.system.duration = {
            value: duration / 60,
            units: 'minute'
        };
    }
    buttonMap = {};
    let [item] = await itemUtils.createItems(selectedToken.actor, [featureData]);
    await item.use();
}
async function use({trigger, workflow}) {
    let flagData = workflow.item.flags?.['chris-premades']?.spotlightOmnisearch;
    if (!flagData) return;
    let {uuid, duration, animation, initiative} = flagData;
    let actor = await fromUuid(uuid);
    if (!actor) return;
    let updates = {
        token: {
            disposition: workflow.token.document.disposition
        },
        actor: {
            prototypeToken: {
                disposition: workflow.token.document.disposition
            }
        }
    };
    let tokens = await Summons.spawn(actor, updates, workflow.item, workflow.token, {
        duration: duration,
        range: 1000,
        animation: animation,
        initiativeType: initiative
    });
    if (!tokens) {
        await genericUtils.remove(workflow.item);
        return;
    }
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'spotlightOmniSearchSummon');
    if (!effect) return;
    await effectUtils.addDependent(effect, [workflow.item]);
}
let buttonMap = {};
async function registerSearchTerms(index) {
    let key = genericUtils.getCPRSetting('monsterCompendium');
    let pack = game.packs.get(key);
    if (!pack) return;
    let packIndex = await pack.getIndex();
    let BaseSearchTerm = CONFIG.SpotlightOmnisearch.SearchTerm;
    packIndex.forEach(i => (index.push(new BaseSearchTerm({
        name: genericUtils.translate('CHRISPREMADES.Generic.Summon') + ' ' + i.name,
        img: i.img,
        type: genericUtils.translate('CHRISPREMADES.Generic.Summon'),
        description: genericUtils.translate('CHRISPREMADES.SpotlightOmnisearch.Description').replace('{name]', i.name),
        keywords: [genericUtils.translate('CHRISPREMADES.Generic.Summon').toLowerCase(), i.name.toLowerCase()],
        onClick: async (event) => await doSummon(event, i.uuid),
        actions: [
            {
                name: genericUtils.translate('CHRISPREMADES.Generic.No'),
                icon: '<i class="fa-solid fa-clock-rotate-left"></i>',
                callback: (event) => {
                    if (event.target.localName != 'button') return;
                    let concentration = genericUtils.getProperty(buttonMap, i._id + '.con') ?? false;
                    genericUtils.setProperty(buttonMap, i._id + '.con', !concentration);
                    event.target.childNodes[1].data = !concentration ? genericUtils.translate('CHRISPREMADES.Generic.Yes') : genericUtils.translate('CHRISPREMADES.Generic.No');
                }
            },
            {
                name: genericUtils.translate('CHRISPREMADES.SpotlightOmnisearch.Time.Minute'),
                icon: '<i class="fa-regular fa-clock"></i>',
                callback: (event) => {
                    if (event.target.localName != 'button') return;
                    let duration = genericUtils.getProperty(buttonMap, i._id + '.dur') ?? 60;
                    let text;
                    switch (duration) {
                        case 60:
                            duration = 3600;
                            text = genericUtils.translate('CHRISPREMADES.SpotlightOmnisearch.Time.Hour');
                            break;
                        case 3600:
                            duration = 86400;
                            text = genericUtils.translate('CHRISPREMADES.SpotlightOmnisearch.Time.Day');
                            break;
                        case 86400:
                            duration = 60;
                            text = genericUtils.translate('CHRISPREMADES.SpotlightOmnisearch.Time.Minute');
                            break;
                    }
                    genericUtils.setProperty(buttonMap, i._id + '.dur', duration);
                    event.target.childNodes[1].data = text;
                }
            },
            {
                name: genericUtils.translate('CHRISPREMADES.Generic.Default'),
                icon: '<i class="fa-solid fa-film"></i>',
                callback: (event) => {
                    if (event.target.localName != 'button') return;
                    let animation = genericUtils.getProperty(buttonMap, i._id + '.ani') ?? 0;
                    animation++;
                    let animations = Object.keys(summonEffects);
                    if (animation >= animations.length) animation = 0;
                    genericUtils.setProperty(buttonMap, i._id + '.ani', animation);
                    let text = genericUtils.titleCase(animations[animation]);
                    event.target.childNodes[1].data = text;
                }
            }
        ]
    }))));
}
export let spotlightOmnisearch = {
    registerSearchTerms
};
export let spotlightOmniSearchSummon = {
    name: 'Spotlight Omnisearch Summon',
    version: '0.12.24',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};