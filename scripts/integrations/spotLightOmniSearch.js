import {chris} from '../helperFunctions.js';
import {summonEffects} from '../macros/animations/summonEffects.js';
import {summons} from '../utility/summons.js';
let buttonMap = {};
async function doSummon(uuid) {
    let dialogApp = Object.values(ui.windows).find(i => i.title === 'spotlight-omnisearch.spotlight.title');
    if (dialogApp) dialogApp.close();
    let selectedToken = canvas.tokens.controlled[0];
    if (!selectedToken) {
        ui.notifications.warn('Please selected a token before using this feature!');
        buttonMap = {};
        return;
    }
    if (!selectedToken.actor) {
        ui.notifications.warn('Selected token is not associated with any actor!');
        buttonMap = {};
        return;
    }
    let actor = await fromUuid(uuid);
    if (!actor) return;
    let savedId = actor.id;
    let spawnActor;
    if (actor.compendium) {
        spawnActor = game.actors.find(i => i.flags.core?.sourceId === actor.uuid);
        if (!spawnActor) {
            let permissionCheck = chris.checkPermission(game.user, 'ACTOR_CREATE');
            if (!permissionCheck) {
                ui.notifications.warn('You do not have permission to create new actors!');
                buttonMap = {};
                return;
            }
            let actorData = duplicate(actor.toObject());
            setProperty(actorData, 'flags.core.sourceId', actor.uuid);
            actor = await Actor.create(actorData);
        } else {
            actor = spawnActor;
        }
    }
    let item = {
        'actor': selectedToken.actor,
        'img': 'icons/magic/time/arrows-circling-green.webp',
        'name': 'CPR Summon',
        'uuid': selectedToken.actor.uuid,
        'flags': {}
    };
    let duration = getProperty(buttonMap, savedId + '.dur') ?? 60;
    let animation = getProperty(buttonMap, savedId + '.ani') ?? 0;
    let animationName = Object.keys(summonEffects)[animation];
    await summons.spawn([actor], {}, duration, item, selectedToken, 120, {'spawnAnimation': animationName});
    let concentration = getProperty(buttonMap, savedId + '.con') ?? false;
    buttonMap = {};
    if (!concentration) return;
    let effect = MidiQOL.getConcentrationEffect(selectedToken.actor);
    if (effect) await chris.removeEffect(effect);
    await chris.addCondition(selectedToken.actor, 'Concentrating', false);
    effect = MidiQOL.getConcentrationEffect(selectedToken.actor);
    let summonEffect = chris.findEffect(selectedToken.actor, item.name);
    if (summonEffect) effect.addDependent(summonEffect);
}
export async function registerSearchTerms(index) {
    let key = game.settings.get('chris-premades', 'Monster Compendium');
    let pack = game.packs.get(key);
    if (!pack) return;
    let packIndex = await pack.getIndex();
    let BaseSearchTerm = CONFIG.SpotlightOmnisearch.SearchTerm;
    packIndex.forEach(i => (index.push(new BaseSearchTerm({
        'name': 'Summon ' + i.name,
        'img': i.img,
        'type': 'Summon',
        'description': 'Summon a ' + i.name + ' using Chris\'s Premades.',
        'keywords': ['summon', i.name.toLowerCase()],
        'onClick': async (event) => {
            await doSummon(i.uuid);
        },
        'actions': [
            {
                'name': 'No',
                'icon': '<i class="fa-solid fa-clock-rotate-left"></i>',
                'callback': (event) => {
                    if (event.target.localName != 'button') return;
                    let concentration = getProperty(buttonMap, i._id + '.con') ?? false;
                    setProperty(buttonMap, i._id + '.con', !concentration);
                    event.target.childNodes[1].data = !concentration ? 'Yes' : 'No';
                }
            },
            {
                'name': '1 Minute',
                'icon': '<i class="fa-regular fa-clock"></i>',
                'callback': (event) => {
                    if (event.target.localName != 'button') return;
                    let duration = getProperty(buttonMap, i._id + '.dur') ?? 60;
                    let text;
                    switch (duration) {
                        case 60:
                            duration = 3600;
                            text = '1 Hour';
                            break;
                        case 3600:
                            duration = 86400;
                            text = '1 Day';
                            break;
                        case 86400:
                            duration = 60;
                            text = '1 Minute';
                            break;
                    }
                    setProperty(buttonMap, i._id + '.dur', duration);
                    event.target.childNodes[1].data = text;
                }
            },
            {
                'name': 'Default',
                'icon': '<i class="fa-solid fa-film"></i>',
                'callback': (event) => {
                    if (event.target.localName != 'button') return;
                    let animation = getProperty(buttonMap, i._id + '.ani') ?? 0;
                    animation++;
                    let animations = Object.keys(summonEffects);
                    if (animation >= animations.length) animation = 0;
                    setProperty(buttonMap, i._id + '.ani', animation);
                    let text = chris.titleCase(animations[animation]);
                    event.target.childNodes[1].data = text;
                }
            }
        ]
    }))));
}