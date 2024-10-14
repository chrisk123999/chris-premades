import {compendiumUtils, constants, genericUtils} from '../utils.js';
import {ItemMedkit} from './medkit-item.js';
let registered = false;
let states = {
    1: async () => {
        await ui.sidebar.expand();
        await ui.sidebar.tabs.compendium.activate();
        await genericUtils.sleep(250);
        let compendiumFolder = game.folders.find(i => i.name === 'Cauldron of Plentiful Resources' && i.type === 'Compendium');
        if (compendiumFolder && !compendiumFolder.expanded) document.querySelector('[data-uuid="' + compendiumFolder.uuid + '"]').classList.remove('collapsed');
    },
    2: async () => {
        let pack = game.packs.get(constants.packs.spells);
        if (!pack) return;
        pack.render(true);
        await genericUtils.sleep(250);
    },
    3: async () => {
        let item = await compendiumUtils.getItemFromCompendium(constants.packs.spells, 'Fire Shield');
        if (!item) return;
        item.sheet.render(true);
        await genericUtils.sleep(250);
    },
    4: async () => {
        let item = await compendiumUtils.getItemFromCompendium(constants.packs.spells, 'Fire Shield');
        if (!item) return;
        ItemMedkit.item(item);
        await genericUtils.sleep(500);
    },
    7: async () => {
        ui.activeWindow.close();
        let item = await compendiumUtils.getItemFromCompendium(constants.packs.spells, 'Fire Shield');
        if (!item) return;
        item.sheet.close();
        let pack = game.packs.get(constants.packs.spells);
        if (!pack) return;
        let compendiumApp = Object.values(ui.windows).find(i => i.metadata?.id === pack.metadata.id);
        if (compendiumApp) compendiumApp.close();
        let actor = await compendiumUtils.getItemFromCompendium('dnd5e.heroes', 'Akra (Dragonborn Cleric)');
        if (!actor) return;
        await actor.sheet.render(true);
        await genericUtils.sleep(250);
    },
    8: async () => {
        let actor = await compendiumUtils.getItemFromCompendium('dnd5e.heroes', 'Akra (Dragonborn Cleric)');
        if (!actor) return;
        await actor.sheet.close();
        await ui.sidebar.expand();
        await ui.sidebar.tabs.journal.activate();
        await genericUtils.sleep(250);
    },
    9: async () => {
        let journalEntry = game.journal.getName('CPR - Descriptions');
        if (journalEntry) journalEntry.sheet.render(true);
        await genericUtils.sleep(250);
    },
    10: async () => {
        game.settings.sheet.render(true, {'activeCategory': 'chris-premades'});
        await genericUtils.sleep(250);
    },
    12: async () => {
        game.settings.sheet.close();
    }
};
class CPRTour extends Tour {
    async next() {
        if (this.status === Tour.STATUS.COMPLETED) throw new Error('Tour ' + this.id + 'has already been completed');
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
async function register() {
    let journalEntry = game.journal.getName('CPR - Descriptions');
    if (!journalEntry) return;
    let dragonBreath = journalEntry.pages.getName('Dragon Breath');
    if (!dragonBreath) return;
    let compendiumFolder = game.folders.find(i => i.name === 'Cauldron of Plentiful Resources' && i.type === 'Compendium');
    if (!compendiumFolder) return;
    let pack = game.packs.get(constants.packs.spells);
    if (!pack) return;
    let fireShield = await compendiumUtils.getItemFromCompendium(constants.packs.spells, 'Fire Shield');
    if (!fireShield) return;
    let maxSteps = 12;
    let steps = [];
    for (let i = 0; i < maxSteps; i++) steps.push({id: 'chris-premades.tour.' + i, title: 'CHRISPREMADES.Tour.' + i + '.Title', content: 'CHRISPREMADES.Tour.' + i + '.Content'});
    steps[1].selector = '[data-uuid="' + compendiumFolder.uuid + '"]';
    steps[2].selector = '[data-document-id="' + fireShield.id + '"]';
    steps[3].selector = '[class="header-button control chris-premades-item"]';
    steps[4].selector = '[class="cpr-medkit-header"]';
    steps[5].selector = '[class="tab cpr-medkit-tab active"]';
    steps[6].selector = '[class="cpr-medkit-tabs tabs"]';
    steps[7].selector = '[class="header-button control chris-premades-item"]';
    steps[8].selector = '[data-document-id="' + journalEntry.id + '"]';
    steps[9].selector = '[data-page-id="' + dragonBreath.id + '"]';
    steps[10].selector = '[data-tab="chris-premades"]';
    steps[11].selector = '[data-key="chris-premades.help"]',
    await game.tours.register('chris-premades', 'tour', new CPRTour({
        title: 'CHRISPREMADES.Tour.Title',
        description: 'CHRISPREMADES.Tour.Description',
        canBeResumed: false,
        display: false,
        steps: steps
    }));
}
async function guidedTour() {
    if (!registered) {
        await register();
        registered = true;
    }
    let tour = game.tours.get('chris-premades.tour');
    if (!tour) return;
    tour.start();
}
async function checkTour() {
    if (!game.user.isGM) return;
    let doMessage = !genericUtils.getCPRSetting('seenTour');
    let message = game.messages.find(i => i.flags?.['chris-premades']?.tour);
    if (!message && doMessage) {
        message = await ChatMessage.create({
            speaker: {alias: genericUtils.translate('CHRISPREMADES.Generic.CPR')},
            content: genericUtils.translate('CHRISPREMADES.Tour.Chat'),
            flags: {
                'chris-premades': {
                    tour: true
                }
            }
        });
        genericUtils.setCPRSetting('seenTour', true);
        await genericUtils.sleep(500);
    }
    if (!message) return;
    let messageElement = document.querySelector('[data-message-id="' + message.id + '"]');
    if (!messageElement) return;
    let button = messageElement.querySelector('[type="button"]');
    if (button) button.onclick = guidedTour;
}
export let tours = {
    guidedTour,
    checkTour
};