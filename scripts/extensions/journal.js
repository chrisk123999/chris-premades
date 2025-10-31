import {genericUtils, errors, constants} from '../utils.js';
export async function setupJournal() {
    let name = 'CPR - Descriptions';
    let welcomeText = genericUtils.translate('CHRISPREMADES.Journal.Welcome');
    let journal = game.journal.getName(name);
    if (!journal) {
        journal = await JournalEntry.create({
            'name': name,
            'pages': [
                {
                    'sort': 100000,
                    'name': 'Info',
                    'type': 'text',
                    'title': {
                        'show': true,
                        'level': 1
                    },
                    'text': {
                        'format': 1,
                        'content': welcomeText,
                    }
                }
            ],
            'ownership': {
                'default': 2
            }
        });
        await ChatMessage.create({
            speaker: {alias: 'Cauldron of Plentiful Resources'},
            content: '<hr>' + genericUtils.translate('CHRISPREMADES.Journal.Chat') + ' @UUID[JournalEntry.' + journal.id + ']{' + genericUtils.translate('CHRISPREMADES.Journal.Readme') + '}'
        });
    } else {
        let page = journal.pages.getName('Info');
        if (page) {
            await page.update({'text.content': welcomeText});
        } else {
            await JournalEntryPage.create({
                name: 'Info', 
                text: {content: welcomeText}, 
                title: {show: false, level: 1}, 
                sort: 0
            }, 
            {
                parent: journal
            });
        }
    }
    let featurePacks = [...Object.values(constants.featurePacks), constants.packs.actions, constants.modernPacks.actions, ...Object.values(constants.modernFeaturePacks)];
    for (let i of featurePacks) {
        let pack = game.packs.get(i);
        if (!pack) {
            errors.missingPack();
            continue;
        }
        let packIndex = await pack.getIndex({fields: ['name']});
        for (let j of packIndex) {
            let page = journal.pages.getName(j.name);
            if (page) continue;
            await JournalEntryPage.create({
                name: j.name, 
                title: {show: false, level: 1}, 
                sort: journal.pages.contents.at(-1).sort + CONST.SORT_INTEGER_DENSITY
            }, 
            {
                parent: journal
            });
        }
    }
}