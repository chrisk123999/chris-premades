let welcomeText = `<p>Thank you for using my module! If you find any bugs or have any requests please either either message <strong>Chris#8375</strong> on Discord or make a <a href="https://github.com/chrisk123999/chris-premades">Github</a> issue. Do not pester tposney, Zhell, or any other module authors with bugs or issues related to this module.</p>
<p>As a note, I generally work-around items that have been imported via the DDB importer module. If something works "as-is" from that module, it's unlikely I'll have it here.</p>
<p>To get started you can find my automations inside the compendiums that start with: "CPR."</p>
<p>You can also click the medical kit icon on the title bar to update the item with my automation. This will preserve your description already on the item. This feature is experimental!</p>
<hr>
<p>Any item, spell, or feature that is added to your sheet temporarily needs a description. Module updates will replace the compendiums they're stored in, so instead the descriptions will be pulled from this journal entry. All pages after this one will not get regenerated when updating this module.</p>
<hr>
<a href="https://ko-fi.com/chrisk123999">
    <img src="https://ko-fi.com/img/githubbutton_sm.svg">
</a>`;
export async function setupJournalEntry() {
    let journalName = 'CPR - Descriptions';
	let journalEntry = game.journal.getName(journalName);
	if (!journalEntry) {
        journalEntry = await JournalEntry.create({
            'name': journalName,
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
                        'markdown': ''
                    }
                }
            ],
            'ownership': {
                'default': 2
            }
	    });
        let message = 'To get started with using Chris\'s premades click here: @UUID[JournalEntry.' + journalEntry.id + ']{Read Me}';
        ChatMessage.create({
            speaker: {alias: name},
            content: message
        });
    } else {
        let page = journalEntry.pages.getName('Info');
        if (page) {
            await page.update({
                'text.content': welcomeText
            })
        }
    }
	async function addPage(journalEntry, pageName, text) {
		await JournalEntryPage.create({
			name: pageName, 
			text: {'content': text}, 
			title: {'show': false, 'level': 1}, 
			sort: journalEntry.sheet._pages.at(-1).sort + CONST.SORT_INTEGER_DENSITY
		}, 
		{
			'parent': journalEntry
		});
	}
	async function checkPage(journalEntry, name) {
		if (!journalEntry.pages.getName(name)) {
            addPage(journalEntry, name, '');
        }
	}
    async function preparePages(journalEntry, packKey) {
        let gamePack = game.packs.get(packKey);
        if (!gamePack) {
            ui.notifications.error('Compendium was not loaded! Journal entries could not be updated.');
            return;
        }
        let packItems = await gamePack.getDocuments();
        for (let i of packItems) {
            if (i.name === '#[CF_tempEntity]') continue;
            await checkPage(journalEntry, i.name);
        }
    }
    await preparePages(journalEntry, 'chris-premades.CPR Spell Features');
    await preparePages(journalEntry, 'chris-premades.CPR Class Feature Items');
    await preparePages(journalEntry, 'chris-premades.CPR Monster Feature Items');
}