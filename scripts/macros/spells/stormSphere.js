import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args}) {
    if (!this.templateUuid) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Storm Sphere Bolt', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Storm Sphere Bolt');
    async function effectMacro () {
		await warpgate.revert(token.document, 'Storm Sphere Handler');
	}
    async function effectMacro2() {
        await chrisPremades.macros.stormSphere.turnStart(actor, effect);
    }
    let effectData = {
        'label': 'Storm Sphere Handler',
        'icon': this.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': this.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                },
                'onEachTurn': {
                    'script':chris.functionToString(effectMacro2)
                }
            },
            'chris-premades': {
                'spell': {
                    'stormSphere': {
                        'templateUuid': this.templateUuid,
                        'castLevel': this.castData.castLevel,
                        'spellSaveDC': chris.getSpellDC(this.item)
                    }
                },
                'vae': {
                    'button': featureData.name
                }
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.label]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': effectData.label,
        'description': featureData.name
    };
    await warpgate.mutate(this.token.document, updates, {}, options);
}
async function boltItem({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetToken = this.targets.first();
    let effect = chris.findEffect(this.actor, 'Storm Sphere Handler');
    if (!effect) return;
    let castLevel = effect.flags['chris-premades']?.spell?.stormSphere?.castLevel;
    if (!castLevel) castLevel = 4;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Storm Sphere Bolt Attack', false);
    if (!featureData) return;
    featureData.system.damage.parts = [
        [
            castLevel + 'd6[lightning]',
            'lightning'
        ]
    ];
    featureData.flags['chris-premades'] = {
		'spell': {
			'castData': {
                'castLevel': castLevel,
                'school': 'evo'
            }
		}
	};
    let feature = new CONFIG.Item.documentClass(featureData, {parent: this.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetToken.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
    let templateUuid = effect.flags['chris-premades']?.spell?.stormSphere?.templateUuid;
    if (!templateUuid) return;
    let template = await fromUuid(templateUuid);
    if (!template) return;
    let chatMessage = game.messages.get(this.itemCardId);
    if (chatMessage) await chatMessage.delete();
    let flag = this.actor.flags['midi-qol']?.ignoreNearbyFoes;
    if (!flag) this.actor.flags['midi-qol'].ignoreNearbyFoes = 1;
    let position = canvas.grid.getSnappedPosition(template.object.center.x, template.object.center.y);
    let savedX = this.token.document.x;
    let savedY = this.token.document.y;
    this.token.document.x = position.x;
    this.token.document.y = position.y;
    await MidiQOL.completeItemUse(feature, {}, options);
    this.token.document.x = savedX;
    this.token.document.y = savedY;
    if (!flag) this.actor.flags['midi-qol'].ignoreNearbyFoes = 0;
    new Sequence().effect().atLocation(template.object).stretchTo(targetToken).file('jb2a.chain_lightning.primary.blue.60ft').play();
}
async function boltAttackItem({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let effect = chris.findEffect(this.actor, 'Storm Sphere Handler');
    if (!effect) return;
    let templateUuid = effect.flags['chris-premades']?.spell?.stormSphere?.templateUuid;
    if (!templateUuid) return;
    let template = await fromUuid(templateUuid);
    if (!template) return;
    let targetToken = this.targets.first();
    if (!chris.tokenInTemplate(targetToken.document, template)) return;
    this.advantage = true;
    this.attackAdvAttribution['Advantage: Storm Sphere'] = true;
}
async function turnStart(actor, effect) {
    let previousTurnId = game.combat.previous.tokenId;
    if (!previousTurnId) return;
    let templateUuid = effect.flags['chris-premades']?.spell?.stormSphere?.templateUuid;
    if (!templateUuid) return;
    let template = await fromUuid(templateUuid);
    if (!template) return;
    let targetToken = game.canvas.tokens.get(previousTurnId);
    if (!chris.tokenInTemplate(targetToken, template)) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Storm Sphere', false);
    if (!featureData) return;
    let stormSphere = effect.flags['chris-premades']?.spell?.stormSphere;
    if (!stormSphere) return;
    featureData.system.save.dc = stormSphere.spellSaveDC;
    featureData.system.damage.parts = [
        [
            stormSphere.castLevel + 'd6[bludgeoning]',
            'bludgeoning'
        ]
    ];
    let feature = new CONFIG.Item.documentClass(featureData, {parent: actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetToken.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    await MidiQOL.completeItemUse(feature, {}, options);
}
export let stormSphere = {
    'item': item,
    'turnStart': turnStart,
    'boltItem': boltItem,
    'boltAttackItem': boltAttackItem
}