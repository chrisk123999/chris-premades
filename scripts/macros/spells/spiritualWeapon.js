import {chris} from '../../helperFunctions.js';
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
        'label': workflow.item.name,
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
                [effectData.label]: effectData
            }
        }
    };
    async function selectTokenImg () {
        let selection;
        let selection2;
        let selection3;
        let selectedImg = '';
        if (game.modules.get('jb2a_patreon')?.active) {
            selection = await chris.dialog('What Style?', [['Flaming', 'Flaming'], ['Dark', 'Dark']]);
            if (!selection) return;
            if (selection === 'Flaming') {
                selection2 = await chris.dialog('What Weapon?', [['Mace', 'Mace01_01_'], ['Maul', 'Maul01_01_'], ['Sword', 'Sword01_01_']]);
                if (!selection2) return;
                selection3 = await chris.dialog('What Color?', [
                    ['Blue', '_Blue'], 
                    ['Green', '_Green'], 
                    ['Yellow', '_Yellow'], 
                    ['Orange', '_Orange'], 
                    ['Red', '_Red'], 
                    ['Purple', '_Purple']
                ]);
                if (!selection3) return;
            }
            if (selection === 'Dark') {
                selection2 = await chris.dialog('What Weapon?', [['Scythe', 'Scythe01_02_'], ['Sword', 'Sword01_01_']]);
                if (!selection2) return;
                selection3 = await chris.dialog('What Color?', [
                    ['Green', '_Green'], 
                    ['Blue', '_Blue'], 
                    ['Purple', '_Purple'], 
                    ['Red', '_Red'], 
                    ['White', '_White']
                ]);
                if (!selection3) return;
            }
            selectedImg = 'modules/jb2a_patreon/Library/2nd_Level/Spiritual_Weapon/SpiritualWeapon_' + selection2 + selection + selection3 + '_200x200.webm';
        } else {
            selection = await chris.dialog('What Weapon?', [['Mace', 'Mace'], ['Maul', 'Maul']]);
            if (!selection) return;
            selection2 = await chris.dialog('What Color?', [['Blue', 'Spectral_Blue'], ['Yellow', 'Flaming_Yellow']]);
            if (!selection2) return;
            selectedImg = 'modules/JB2A_DnD5e/Library/2nd_Level/Spiritual_Weapon/SpiritualWeapon_' + selection + '01_01_' + selection2 + '_200x200.webm';
        }
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
        'label': workflow.item.name,
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
    let attackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Spiritual Weapon - Attack', false);
    if (!attackFeatureData) return;
    attackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Spiritual Weapon - Attack');
    attackFeatureData.system.ability = workflow.item.system.ability;
    let spellLevel = workflow.castData?.castLevel;
    if (!spellLevel) return;
    let scaling = Math.floor(spellLevel / 2);
    attackFeatureData.system.damage.parts[0] = scaling + 'd8[force] + @mod';
    let updates2 = {
        'embedded': {
            'Item': {
                [attackFeatureData.name]: attackFeatureData
            },
            'ActiveEffect': {
                [casterEffectData.label]: casterEffectData
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
    await workflow.item.setFlag('chris-premades', 'feature.spiritualWeapon.position', {'x': workflow.token.document.x, 'y': workflow.token.document.y});
    await workflow.actor.setFlag('chris-premades', 'mechanic.noFlanking', true);
    let weaponTokenUuid = workflow.actor.flags['chris-premades']?.feature?.spiritualWeapon?.tokenUuid;
    if (!weaponTokenUuid) return;
    let weaponToken = await fromUuid(weaponTokenUuid);
    if (!weaponToken) return;
    let position = canvas.grid.getSnappedPosition(weaponToken.x, weaponToken.y);
    workflow.token.document.x = position.x;
    workflow.token.document.y = position.y;
    workflow.flankingAdvantage = false; //Does not currently work.
}
async function attackLate({speaker, actor, token, character, item, args, scope, workflow}) { 
    await workflow.actor.unsetFlag('chris-premades', 'mechanic.noFlanking');
    let position = workflow.item.flags['chris-premades']?.feature?.spiritualWeapon?.position;
    if (!position) return;
    workflow.token.document.x = position.x;
    workflow.token.document.y = position.y;
}
export let spiritualWeapon = {
    'item': item,
    'attackEarly': attackEarly,
    'attackLate': attackLate
}