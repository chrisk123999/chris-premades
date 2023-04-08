import {chris} from '../../helperFunctions.js';
export async function shadowBlade({speaker, actor, token, character, item, args}) {
	let targetToken = this.token;
	let spellLevel = this.castData.castLevel;
	let weaponData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Shadow Blade Sword', false);
    if (!weaponData) return;
	let diceNum = 2;
	switch (spellLevel) {
		case 3:
		case 4:
			diceNum = 3;
			break;
		case 5:
		case 6:
			diceNum = 4;
			break;
		case 7:
		case 8:
		case 9:
			diceNum = 5;
			break;
	}
	weaponData.system.damage.parts = [
		[
			diceNum + 'd8[psychic ] + @mod',
			'psychic'
		]
	];
	weaponData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Shadow Blade Sword');
	async function effectMacro () {
		await warpgate.revert(token.document, 'Shadow Blade Sword');
	}
	let effectData = {
		'label': weaponData.name,
		'icon': this.item.img,
		'duration': {
			'seconds': 60
		},
		'origin': this.item.uuid,
		'flags': {
			'effectmacro': {
				'onDelete': {
					'script': chris.functionToString(effectMacro)
				}
			},
            'chris-premades': {
                'vae': {
                    'button': weaponData.name
                }
            }
		}
	};
	let updates = {
        'embedded': {
            'Item': {
                [weaponData.name]: weaponData
            },
            'ActiveEffect': {
                [weaponData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': weaponData.name,
        'description': weaponData.name
    };
    await warpgate.mutate(targetToken.document, updates, {}, options);
}