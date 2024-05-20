import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {translate} from '../../translations.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Spiritual Weapon');
    if (!sourceActor) return;
    async function effectMacro() {
        let originActor = origin.actor;
        await warpgate.dismiss(token.id);
        let castEffect = chrisPremades.helpers.findEffect(originActor, origin.name);
        if (castEffect) await chrisPremades.helpers.removeEffect(castEffect);
    }
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'vae': {
                    'button': 'Dismiss Summon'
                }
            }
        }
    };
    let name = chris.getConfiguration(workflow.item, 'name') ?? 'Spiritual Weapon';
    if (name === '') name = 'Spiritual Weapon';
    let updates = {
        'actor': {
            'name': name,
            'prototypeToken': {
                'name': name
            }
        },
        'token': {
            'name': name
        },
        'embedded': {
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    async function selectTokenImg () {
        let selection;
        let selection2;
        let selection3;
        let selectedImg = '';
        if (!chris.jb2aCheck()) {
            return;
        }
        if (chris.jb2aCheck() === 'patreon') {
            selection = await chris.dialog('What Style?', [['Flaming', 'flaming'], ['Dark', 'dark']]);
            if (!selection) return;
            if (selection === 'flaming') {
                selection2 = await chris.dialog('What Weapon?', [['Mace', 'mace'], ['Maul', 'maul'], ['Sword', 'sword']]);
                if (!selection2) return;
                selection3 = await chris.dialog('What Color?', [
                    ['Blue', 'blue'], 
                    ['Green', 'green'], 
                    ['Yellow', 'yellow'], 
                    ['Orange', 'orange'], 
                    ['Red', 'red'], 
                    ['Purple', 'purple']
                ]);
                if (!selection3) return;
            }
            if (selection === 'dark') {
                selection2 = await chris.dialog('What Weapon?', [['Scythe', 'scythe'], ['Sword', 'sword']]);
                if (!selection2) return;
                selection3 = await chris.dialog('What Color?', [
                    ['Green', 'green'], 
                    ['Blue', 'blue'], 
                    ['Purple', 'purple'], 
                    ['Red', 'red'], 
                    ['White', 'white']
                ]);
                if (!selection3) return;
            }
            selectedImg = 'jb2a.spiritual_weapon.' + selection2 + '.' + selection + '.' + selection3;
        } else {
            selection = await chris.dialog('What Weapon?', [['Mace', 'mace'], ['Maul', 'maul']]);
            if (!selection) return;
            selection2 = await chris.dialog('What Color?', [['Blue', 'spectral.blue'], ['Yellow', 'flaming.yellow']]);
            if (!selection2) return;
            selectedImg = 'jb2a.spiritual_weapon.' + selection + '.' + selection2;;
        }
        selectedImg = await Sequencer.Database.getEntry(selectedImg).file;
        return selectedImg;
    }
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar');
    if (avatarImg) updates.actor.img = avatarImg;
    let tokenImg = chris.getConfiguration(workflow.item, 'token');
    if (!tokenImg) tokenImg = await selectTokenImg();
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    let options = {
        'controllingActor': workflow.token.actor
    };
    let tokenDocument = await sourceActor.getTokenDocument();
    let spawnedTokens = await warpgate.spawn(tokenDocument, updates, {}, options);
    if (!spawnedTokens) return;
    let spawnedToken = game.canvas.scene.tokens.get(spawnedTokens[0]);
    if (!spawnedToken) return;
    let targetEffect = chris.findEffect(spawnedToken.actor, workflow.item.name);
    if (!targetEffect) return;
    let casterEffectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'changes': [
            {
                'key': 'flags.chris-premades.feature.spiritualWeapon.tokenUuid',
                'mode': 5,
                'value': spawnedToken.uuid,
                'priority': 20
            }
        ],
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': 'let effect = await fromUuid("' + targetEffect.uuid + '"); if (effect) await chrisPremades.helpers.removeEffect(effect); await warpgate.revert(token.document, "Spiritual Weapon");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': 'Spiritual Weapon - Attack'
                }
            }
        }
    };
    let attackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Spiritual Weapon - Attack');
    if (!attackFeatureData) return;
    attackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Spiritual Weapon - Attack');
    attackFeatureData.system.ability = workflow.item.system.ability;
    let spellLevel = workflow.castData?.castLevel;
    if (!spellLevel) return;
    let scaling = Math.floor(spellLevel / 2);
    attackFeatureData.system.damage.parts[0][0] = scaling + 'd8[' + translate.damageType('force') + '] + @mod';
    let updates2 = {
        'embedded': {
            'Item': {
                [attackFeatureData.name]: attackFeatureData
            },
            'ActiveEffect': {
                [casterEffectData.name]: casterEffectData
            }
        }
    };
    let options2 = {
        'permanent': false,
        'name': 'Spiritual Weapon',
        'description': 'Spiritual Weapon'
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options2);
}
async function attackEarly({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    let weaponTokenUuid = workflow.actor.flags['chris-premades']?.feature?.spiritualWeapon?.tokenUuid;
    if (!weaponTokenUuid) return;
    let weaponToken = await fromUuid(weaponTokenUuid);
    if (!weaponToken) return;
    let effectData = {
        'name': 'Spiritual Weapon Attack',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.rangeOverride.attack.all',
                'mode': 0,
                'value': 1,
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'effect': {
                    'noAnimation': true
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData);
    await chris.createEffect(weaponToken.actor, effectData);
}
async function attackLate({speaker, actor, token, character, item, args, scope, workflow}) {
    let weaponTokenUuid = workflow.actor.flags['chris-premades']?.feature?.spiritualWeapon?.tokenUuid;
    if (!weaponTokenUuid) return;
    let weaponToken = await fromUuid(weaponTokenUuid);
    if (!weaponToken) return;
    let effect1 = chris.findEffect(workflow.actor, 'Spiritual Weapon Attack');
    let effect2 = chris.findEffect(weaponToken.actor, 'Spiritual Weapon Attack');
    if (effect1) await chris.removeEffect(effect1);
    if (effect2) await chris.removeEffect(effect2);
}
export let spiritualWeapon = {
    'item': item,
    'attackEarly': attackEarly,
    'attackLate': attackLate
}