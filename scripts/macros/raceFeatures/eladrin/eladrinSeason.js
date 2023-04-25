import {chris} from '../../../helperFunctions.js';
export async function eladrinSeason({speaker, actor, token, character, item, args}) {
    if (!this.token) return;
    let currentSeason = this.actor.flags['chris-premades']?.race?.eladrin?.season;
    let generatedMenu = [];
    if (currentSeason != 'Autumn') generatedMenu.push(['🍂 Autumn', 'Autumn']);
    if (currentSeason != 'Winter') generatedMenu.push(['❄️ Winter', 'Winter']);
    if (currentSeason != 'Spring') generatedMenu.push(['🌼 Spring', 'Spring']);
    if (currentSeason != 'Summer') generatedMenu.push(['☀️ Summer', 'Summer']);
    let selection = await chris.dialog('What season?', generatedMenu);
    if (!selection) return;
    async function effectMacro () {
        await warpgate.revert(token.document, 'Eladrin Season');
    }
    let effectData = {
        'label': 'Eladrin Season',
        'icon': this.item.img,
        'changes': [
            {
                'key': 'flags.chris-premades.race.eladrin.season',
                'mode': 5,
                'value': selection,
                'priority': 20
            }
        ],
        'duration': {
            'seconds': 604800
        },
        'origin': this.item.uuid,
        'flags': {
            'dae': {
                'selfTarget': true,
                'selfTargetAlways': false,
                'stackable': 'none',
                'durationExpression': '',
                'macroRepeat': 'none',
                'specialDuration': [
                    'longRest'
                ],
                'transfer': true
            },
            'effectmacro': {
                'onDelete': {
                    'script': chrisPremades.helpers.functionToString(effectMacro)
                }
            }
        }
    }
    let tokenArt = this.actor.flags['chris-premades']?.race?.eladrin?.art?.token?.[selection];
    let avatarArt = this.actor.flags['chris-premades']?.race?.eladrin?.art?.avatar?.[selection];
    let updates = {
        'embedded': {
            'ActiveEffect': {
                [effectData.label]: effectData
            }
        }
    };
    if (tokenArt != '' && tokenArt) {
        updates.token = {
            'texture': {
                'src': tokenArt
            }
        }
        updates.actor = {
            'prototypeToken': {
                'texture': {
                    'src': tokenArt
                }
            }
        }
    }
    if (avatarArt != '' && avatarArt) {
        if (!updates.actor) updates.actor = {};
        updates.actor.img = avatarArt;
    }
    if (this.actor.system.details.level >= 3) {
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Race Feature Items', 'Fey Step (' + selection + ')', false);
        if (!featureData) return;
        featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Fey Step (' + selection + ')');
        featureData.system.save.dc = chris.getSpellDC(this.item);
        updates.embedded.Item = {
            [featureData.name]: featureData
        }
    }
    let options = {
        'permanent': false,
        'name': 'Eladrin Season',
        'description': 'Eladrin Season'
    };
    let effect = chris.findEffect(this.actor, 'Eladrin Season');
    if (effect)  await chris.removeEffect(effect);
    await warpgate.mutate(this.token.document, updates, {}, options);
}