import {chris} from '../../helperFunctions.js';
async function itemData() {
    let key = game.settings.get('chris-premades', 'Spell Compendium');
    if (!game.packs.get(key)) return undefined;
    let spellData = await chris.getItemFromCompendium(key, 'Bigby\'s Hand');
    if (!spellData) return undefined;
    spellData.system.level = 9;
    spellData.system.uses = {
        'value': 1,
        'max': 1,
        'per': 'dawn',
        'recovery': '1',
        'prompt': true
    };
    spellData.system.preparation.mode = 'atwill';
    spellData.system.properties = spellData.system.properties.filter(i => i != 'concentration');
    spellData.name += ' (9th Level)';
    setProperty(spellData, 'flags.custom-character-sheet-sections.sectionName', 'Bigby\'s Beneficent Bracelet');
    setProperty(spellData, 'flags.chris-premades.items.bigbysBeneficentBracelet', true);
    return spellData;
}
async function forceSculpture({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Force Sculpture');
    if (!sourceActor) return;
    let selection = await chris.dialog(workflow.item.name, [['Large', 'lg'], ['Medium', 'med'], ['Small', 'sm'], ['Tiny', 'tiny']]);
    if (!selection) return;
    let sizes = {
        'lg': 2,
        'med': 1,
        'sm': 1
    };
    let effectData = {
        'name': 'Force Sculpture',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 28800
        },
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': 'await warpgate.dismiss(token.id);'
                }
            }
        }
    };
    let updates = {
        'actor': {
            'system': {
                'traits': {
                    'size': selection
                }
            },
            'name': 'Force Sculpture',
            'prototypeToken': {
                'name': 'Force Sculpture',
                'width': sizes[selection],
                'height': sizes[selection]
            }
        },
        'token': {
            'width': sizes[selection],
            'height': sizes[selection]
        },
        'embedded': {
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    switch (selection) {
        case 'sm':
            setProperty(updates, 'actor.prototypeToken.texture.scaleX', 0.8);
            setProperty(updates, 'actor.prototypeToken.texture.scaleY', 0.8);
            setProperty(updates, 'token.texture.scaleX', 0.8);
            setProperty(updates, 'token.texture.scaleY', 0.8);
            break;
        case 'tiny':
            setProperty(updates, 'actor.prototypeToken.texture.scaleX', 0.5);
            setProperty(updates, 'actor.prototypeToken.texture.scaleY', 0.5);
            setProperty(updates, 'token.texture.scaleX', 0.5);
            setProperty(updates, 'token.texture.scaleY', 0.5);
    }
    await chris.spawn(sourceActor, updates, undefined, workflow.token, 10, 'earth');
}
export let bigbysBeneficentBracelet = {
    'itemData': itemData,
    'forceSculpture': forceSculpture
};