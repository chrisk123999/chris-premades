import {chris} from './helperFunctions.js';
export async function info({speaker, actor, token, character, item, args, scope, workflow}) {
    let info = item?.flags?.['chris-premades']?.info;
    if (!info) return;
    let message = '';
    let cancel = false;
    if (info.version) {
        let currentVersion = automations[info.name].version
        let itemVersion = info.version;
        if (isNewerVersion(currentVersion, itemVersion)) {
            message += 'Automation is out of date!<br>Item Version: ' + itemVersion + '<br>Updated Version: ' + currentVersion;
            cancel = true;
        }
    }
    if (info.settings) {
        let missingSettings = [];
        for (let i of info.settings) {
            if (!game.settings.get('chris-premades', i)) missingSettings.push(i);
        }
        if (missingSettings.length > 0) {
            if (message != '') message += '<hr>';
            message += 'This automation requires the following settings to be enabled:';
            for (let i of missingSettings) {
                message += '<br>' + i;
            }
            cancel = true;
        }
    }
    if (info.mutation) {
        if (info.mutation.self) {
            if (!workflow.token) {
                if (message != '') message += '<hr>';
                message += 'This automation requires your token to be on the scene.';
                cancel = true;
            } else {
                let mutationStack = warpgate.mutationStack(workflow.token.document);
                if (mutationStack.getName(info.mutation.self)) await warpgate.revert(workflow.token.document, info.mutation.self);
                console.warn('A duplicate CPR Warpgate mutation was detected and removed!');
            }
        }
    }
    if (info.actors) {
        let missingActors = [];
        for (let i of info.actors) {
            if (!game.actors.getName(i)) missingActors.push(i);
        }
        if (missingActors.length > 0) {
            if (message != '') message += '<hr>';
            message += 'This automation requires the following sidebar actors:';
            for (let i of missingActors) {
                message += '<br>' + i;
            }
            cancel = true;
        }
    }
    if (cancel) {
        ChatMessage.create({
            'speaker': {alias: name},
            'content': message
        });
        return false;
    }
}
export async function setItemInfo(itemUuid) {
    if (!itemUuid) {
        let selection0 = await warpgate.menu({
            'inputs': [
                {
                    'label': 'Item Uuid:',
                    'type': 'text',
                    'options': ''
                }
            ],
            'buttons': [
                {
                    'label': 'Next',
                    'value': true,
                    'default': true
                }
            ]
        },
        {
            'title': 'Item Uuid'
        });
        if (!selection0.buttons) return;
        itemUuid = selection0.inputs[0];
    }
    let currentVersion = '0.6.01';
    let item = await fromUuid(itemUuid);
    if (!item) return;
    let updates = {};
    setProperty(updates, 'flags.chris-premades.info.name', item.name);
    let selection = await warpgate.menu({
        'inputs': [
            {
                'label': 'Version: ',
                'type': 'text',
                'options': currentVersion
            }
        ],
        'buttons': [
            {
                'label': 'Next',
                'value': true,
                'default': true
            }
        ]
    },
    {
        'title': 'Version'
    });
    if (!selection.buttons) return;
    setProperty(updates, 'flags.chris-premades.info.version', selection.inputs[0]);
    let selection2 = await warpgate.menu({
        'inputs': [
            {
                'label': 'Setting 1:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Setting 2:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Setting 3:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Setting 4:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Setting 5:',
                'type': 'text',
                'options': ''
            },
        ],
        'buttons': [
            {
                'label': 'Next',
                'value': true,
                'default': true
            }
        ]
    },
    {
        'title': 'Settings'
    });
    if (!selection2.buttons) return;
    let settings = selection2.inputs.filter(i => i != '');
    if (settings.length != 0) {
        setProperty(updates, 'flags.chris-premades.info.settings', settings);
    }
    let selection3 = await warpgate.menu({
        'inputs': [
            {
                'label': 'Self Mutation Name',
                'type': 'text',
                'options': ''
            }
        ],
        'buttons': [
            {
                'label': 'Next',
                'value': true,
                'default': true
            }
        ]
    },
    {
        'title': 'Self Mutation'
    });
    if (!selection3.buttons) return;
    if (selection3.inputs[0] != '') setProperty(updates, 'flags.chris-premades.info.mutation.self', selection3.inputs[0]);
    let selection4 = await warpgate.menu({
        'inputs': [
            {
                'label': 'Actor 1:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Actor 2:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Actor 3:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Actor 4:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Actor 5:',
                'type': 'text',
                'options': ''
            },
        ],
        'buttons': [
            {
                'label': 'Next',
                'value': true,
                'default': true
            }
        ]
    },
    {
        'title': 'Actors'
    });
    if (!selection4.buttons) return;
    let actors = selection4.inputs.filter(i => i != '');
    if (actors.length != 0) {
        setProperty(updates, 'flags.chris-premades.info.actors', actors);
    }
    await item.update(updates);
}
export let automations = {
    'Armor of Agathys': {
        'name': 'Armor of Agathys',
        'version': '0.6.01',
        'settings': [
            'Armor of Agathys'
        ]
    },
    'Arms of Hadar': {
        'name': 'Arms of Hadar',
        'version': '0.6.01'
    },
    'Aura of Purity': {
        'name': 'Aura of Purity',
        'version': '0.6.01',
        'settings': [
            'Effect Auras'
        ]
    },
    'Aura of Vitality': {
        'name': 'Aura of Vitality',
        'version': '0.6.01',
        'mutation': {
            'self': 'Aura of Vitality'
        }
    },
    'Beacon of Hope': {
        'name': 'Beacon of Hope',
        'version': '0.6.01',
        'settings': [
            'Beacon of Hope'
        ]
    },
    'Bestow Curse': {
        'name': 'Bestow Curse',
        'version': '0.6.01',
    },
    'Bigby\'s Hand': {
        'name': 'Bigby\'s Hand',
        'version': '0.6.01',
        'actors': [
            'CPR - Bigby\'s Hand'
        ]
    },
    'Blade Ward': {
        'name': 'Blade Ward',
        'version': '0.6.01'
    },
    'Blight': {
        'name': 'Blight',
        'version': '0.6.01'
    },
    'Blink': {
        'name': 'Blink',
        'version': '0.6.01'
    },
    'Call Lightning': {
        'name': 'Call Lightning',
        'version': '0.6.01',
        'mutation': {
            'self': 'Storm Bolt'
        }
    },
    'Chain Lightning': {
        'name': 'Chain Lightning',
        'version': '0.6.01'
    },
    'Charm Person': {
        'name': 'Charm Person',
        'version': '0.6.01'
    },
    'Chill Touch': {
        'name': 'Chill Touch',
        'version': '0.6.01'
    },
    'Chromatic Orb': {
        'name': 'Chromatic Orb',
        'version': '0.6.01'
    },
    'Cloudkill': {
        'name': 'Cloudkill',
        'version': '0.6.01',
        'settings': [
            'Template Listener'
        ]
    },
    'Crown of Madness': {
        'name': 'Crown of Madness',
        'version': '0.6.01'
    },
    'Crusader\'s Mantle': {
        'name': 'Crusader\'s Mantle',
        'version': '0.6.01'
    },
    'Danse Macabre': {
        'name': 'Danse Macabre',
        'version': '0.6.01',
        'mutation': {
            'self': 'Danse Macabre'
        },
        'actors': [
            'CPR - Skeleton',
            'CPR - Zombie'
        ]
    },
    'Darkness': {
        'name': 'Darkness',
        'version': '0.6.01'
    },
    'Dawn': {
        'name': 'Dawn',
        'version': '0.6.01',
        'mutation': {
            'self': 'Dawn'
        }
    },
    'Death Ward': {
        'name': 'Death Ward',
        'version': '0.6.01',
        'settings': [
            'Death Ward'
        ]
    },
    'Destructive Wave': {
        'name': 'Destructive Wave',
        'version': '0.6.01'
    },
    'Detect Magic': {
        'name': 'Detect Magic',
        'version': '0.6.01'
    },
    'Detect Thoughts': {
        'name': 'Detect Thoughts',
        'version': '0.6.01',
        'mutation': {
            'self': 'Detect Thoughts - Probe Deeper'
        }
    },
    'Dragon\'s Breath': {
        'name': 'Dragon\'s Breath',
        'version': '0.6.01',
        'mutation': {
            'self': 'Dragon Breath'
        }
    }
}