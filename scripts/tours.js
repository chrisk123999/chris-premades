import {chris} from './helperFunctions.js';
let registered = false;
let states = {
    1: async () => {
        await ui.sidebar.expand();
        await ui.sidebar.tabs.journal.activate();
    },
    2: async () => {
        let journalEntry = game.journal.getName('CPR - Descriptions');
        if (journalEntry) journalEntry.sheet.render(true);
        await warpgate.wait(250);
    },
    3: async () => {
        let journalEntry = game.journal.getName('CPR - Descriptions');
        if (journalEntry && journalEntry.sheet.rendered) journalEntry.sheet.close();
        await ui.sidebar.expand();
        await ui.sidebar.tabs.compendium.activate();
        await warpgate.wait(250);
        let compendiumFolder = game.folders.find(i => i.name === 'Chris\'s Premades' && i.type === 'Compendium');
        if (compendiumFolder && !compendiumFolder.expanded) document.querySelector('[data-uuid="' + compendiumFolder.uuid + '"]').classList.remove('collapsed');
    },
    4: async () => {
        let pack = game.packs.get('chris-premades.CPR Spells');
        if (!pack) return;
        pack.render(true);
        await warpgate.wait(250);
    },
    5: async () => {
        let pack = game.packs.get('chris-premades.CPR Spells');
        if (!pack) return;
        let index = await pack.getIndex();
        let fireShield = index.getName('Fire Shield');
        if (!fireShield) return;
        let document = await pack.getDocument(fireShield._id);
        document.sheet.render(true);
        await warpgate.wait(250);
    },
    6: async () => {
        let pack = game.packs.get('chris-premades.CPR Spells');
        if (!pack) return;
        let index = await pack.getIndex();
        let fireShield = index.getName('Fire Shield');
        if (!fireShield) return;
        let document = await pack.getDocument(fireShield._id);
        document.sheet.close();
        let compendiumApp = Object.values(ui.windows).find(i => i.metadata?.label === 'CPR Spells');
        if (compendiumApp) compendiumApp.close();
        game.settings.sheet.render(true, {'activeCategory': 'chris-premades'});
        await warpgate.wait(250);
    },
    8: async () => {
        game.settings.sheet.close();
        let pack = game.packs.get('dnd5e.heroes')
        if (!pack) return;
        let index = await pack.getIndex();
        let rogue = index.getName('Riswynn (Dwarf Rogue)')
        if (!rogue) return;
        let document = await pack.getDocument(rogue._id);
        if (!document) return;
        document.sheet.render(true);
        await warpgate.wait(250);
        let feature = document.items.getName('Sneak Attack')
        if (!feature) return;
        feature.sheet.render(true);
        await warpgate.wait(250);
    },
    9: async () => {
        chris.dialog('Item Configuration: Example', [['🔎 Update / Replace Item', false], ['🛠️ Configure', false], ['⚖️ Add Scale', false]]);
        await warpgate.wait(250);
    },
    12: async () => {
        let dialogApp = Object.values(ui.windows).find(i => i.data?.title === 'Item Configuration: Example');
        if (dialogApp) dialogApp.close();
        let pack = game.packs.get('dnd5e.heroes')
        if (!pack) return;
        let index = await pack.getIndex();
        let rogue = index.getName('Riswynn (Dwarf Rogue)')
        if (!rogue) return;
        let document = await pack.getDocument(rogue._id);
        if (!document) return;
        let feature = document.items.getName('Sneak Attack')
        if (!feature) return;
        feature.sheet.close();
        document.sheet.close();
        await ui.sidebar.tabs.chat.activate();
        let journalEntry = game.journal.getName('CPR - Descriptions');
        if (journalEntry) await journalEntry.sheet.render(true);
    }

}
class chrisTour extends Tour {
    async next() {
        if (this.status === Tour.STATUS.COMPLETED) {
            throw new Error('Tour ' + this.id + 'has already been completed');
        }
        if (!this.hasNext) return this.complete();
        let nextIndex = this.stepIndex + 1;
        if (states[nextIndex]) await states[nextIndex]();
        return this.progress(nextIndex);
    }
    get hasPrevious() {
        return false;
    }
    async complete() {
        let nextIndex = this.stepIndex + 1;
        await states[nextIndex]();
        return this.progress(this.steps.length);
    }
}
async function registerTours() {
    let journalEntry = game.journal.getName('CPR - Descriptions');
    if (!journalEntry) return;
    let dragonBreath = journalEntry.pages.getName('Dragon Breath');
    if (!dragonBreath) return;
    let compendiumFolder = game.folders.find(i => i.name === 'Chris\'s Premades' && i.type === 'Compendium');
    if (!compendiumFolder) return;
    let pack = game.packs.get('chris-premades.CPR Spells');
    if (!pack) return;
    let index = await pack.getIndex();
    let fireShield = index.getName('Fire Shield');
    if (!fireShield) return;
    await game.tours.register('chris-premades', 'tour', new chrisTour({
        'title': 'CPR Tour',
        'description': 'CPR Tour',
        'canBeResumed': false,
        'display': false,
        'steps': [
            {
                'id': 'chris-premades.tour.0',
                'title': 'Welcome!',
                'content': 'This tour will guide you through using some of the core features of using Chris\'s Premades.'
            },
            {
                'id': 'chris-premades.tour.1',
                'title': 'The Description Journal',
                'selector': '[data-document-id="' + journalEntry.id + '"]',
                'content': 'This journal is used to store descriptions for temporary spells, items, and features.'
            },
            {
                'id': 'chris-premades.tour.2',
                'title': 'The Description Journal',
                'selector': '[data-page-id="' + dragonBreath.id + '"]',
                'content': 'For example, the spell "Dragon\'s Breath" will make a temporary feature called "Dragon Breath" on the target actor.\nFilling in this journal page will populate the description when it\'s created.'
            },
            {
                'id': 'chris-premades.tour.3',
                'title': 'Content Compendiums',
                'selector': '[data-uuid="' + compendiumFolder.uuid + '"]',
                'content': 'This is where all the content from this module is stored.'
            },
            {
                'id': 'chris-premades.tour.4',
                'title': 'Item Info',
                'selector': '[data-document-id="' + fireShield._id + '"]',
                'content': 'As an example the spell "Fire Shield" is stored in the "CPR Spells" compendium. You can drag the spell from this compendium onto an actor sheet.'
            },
            {
                'id': 'chris-premades.tour.5',
                'title': 'Item Description',
                'selector': '[id*="-Compendium-chris-premades-CPR Spells-Item-' + fireShield._id + '"]',
                'content': 'Some automations require specific settings to be enabled.\nFor example, the "Fire Shield" spell requires the "On Hit Automation" setting to be enabled.'
            },
            {
                'id': 'chris-premades.tour.6',
                'title': 'Settings',
                'selector': '[data-tab="chris-premades"]',
                'content': 'All of the module settings are located here and organized into categories.'
            },
            {
                'id': 'chris-premades.tour.7',
                'title': 'Settings',
                'selector': '[data-key="chris-premades.General"]',
                'content': '"On Hit Automation" is located in this category, along with many other useful settings.'
            },
            {
                'id': 'chris-premades.tour.8',
                'title': 'The Medkit',
                'selector': '[class="header-button control chris-premades-item"]',
                'content': 'As an alternative to copying items out of the compendiums, you can use the medkit button on the title bar.\nThis button is only available on items that are on actors (Not items in your items directory!).\nThe medkit will automatically search the compendiums and locate an automation for you (if one is available).\nThis search is based on the type of the item and it\'s name.'
            },
            {
                'id': 'chris-premades.tour.9',
                'title': 'The Medkit',
                'selector': '[class="dialog-button 🔎 Update / Replace Item"]',
                'content': 'This button will update the item from the compendium.\nThe item description, spell preparation, item uses, and quantity will be preserved.'
            },
            {
                'id': 'chris-premades.tour.10',
                'title': 'The Medkit',
                'selector': '[class="dialog-button 🛠️ Configure"]',
                'content': 'This button will allow you to configure certain options for the automation.\nFor example, "Sneak Attack" can be configured to automatically apply sneak attack on valid attacks instead of prompting you to use it.'
            },
            {
                'id': 'chris-premades.tour.11',
                'title': 'The Medkit',
                'selector': '[class="dialog-button ⚖️ Add Scale"]',
                'content': 'This button (which is only available on certain class items) will allow you to automatically create the needed advancement scale for certain automations.\nFor example, "Sneak Attack" requires a sneak attack die scale set.'
            }
        ]
    }));
}
async function guidedTour() {
    if (!registered) {
        await registerTours();
        registered = true;
    }
    let tour = game.tours.get('chris-premades.tour');
    if (!tour) return;
    tour.start();
}
async function checkTour() {
    if (!game.user.isGM) return;
    let makeMessage = !game.settings.get('chris-premades', 'Tour Message');
    let message = '<hr>View a guided tour of Chris\'s Premades here:<br><button type="button">Start Tour</button>';
    let chatMessage = game.messages.find(i => i.flags?.['chris-premades']?.tour);
    if (!chatMessage && makeMessage) {
        chatMessage = await ChatMessage.create({
            'speaker': {'alias': 'Chris\'s Premades'},
            'content': message,
            'flags': {
                'chris-premades': {
                    'tour': true
                }
            }
        });
        await warpgate.wait(250);
        game.settings.set('chris-premades', 'Tour Message', true);
    }
    if (!chatMessage) return;
    let messageElement = document.querySelector('[data-message-id="' + chatMessage.id + '"]');
    let button = messageElement.querySelector('[type="button"]');
    button.onclick = guidedTour;

}
export let tours = {
    'registerTours': registerTours,
    'guidedTour': guidedTour,
    'chrisTour': chrisTour,
    'checkTour': checkTour
}