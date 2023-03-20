import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
export async function bladeFlourish({speaker, actor, token, character, item, args}) {
    let itemName = this.item.name.toLowerCase()
    if (itemName.search('booming blade') || itemName.search('green-flame Blade')) return;
    let sourceActor = this.actor;
    let effect1 = chris.findEffect(sourceActor, 'Blade Flourish Movement');
    if (this.item.type === 'weapon' && !effect1) {
        let feature0 = sourceActor.items.getName('Blade Flourish Movement');
        if (feature0) feature0.use();
    }
    if (this.item.type === 'weapon' && this.hitTargets.size === 1) {
        let effect2 = chris.findEffect(sourceActor, 'Blade Flourish');
        if (effect2) return;
        let bardicInspiration = sourceActor.items.getName('Bardic Inspiration');
        if (!bardicInspiration) bardicInspiration = sourceActor.items.getName('Bardic Inspiration & Magical Inspiration');
        if (!bardicInspiration) {
            ui.notifications.warn('Source actor does not appear to have a Bardic Inspiration feature!');
            return;
        }
        let queueSetup = await queue.setup(this.item.uuid, 'bladeFlourish', 151);
        if (!queueSetup) return;
        let bardicInspirationUses = bardicInspiration.system.uses.value;
        let classFeature = sourceActor.items.getName('Bard');
        let skipUses = false;
        if (classFeature) {
            let levels = classFeature.system.levels;
            if (levels >= 14) skipUses = await chris.dialog('Use d6 instead of Bardic Inspiration for Blade Flourish?', [['Yes', true], ['No', false]]);
        }
        if (bardicInspirationUses <= 0 && !skipUses) {
            queue.remove(this.item.uuid);
            return;
        }
        let options = [
            ['Defensive Flourish', 'DF'],
            ['Mobile Flourish', 'MF'],
            ['Slashing Flourish', 'SF'],
            ['No', false]
        ];
        let selectedOption = await chris.dialog('Use a Blade Flourish?', options);
        if (!selectedOption) {
            queue.remove(this.item.uuid);
            return;
        }
        let effectData1 = {
            'label': 'Blade Flourish',
            'icon': 'icons/skills/melee/maneuver-sword-katana-yellow.webp',
            'duration': {'turns': 1},
            'origin': this.item.uuid,
            'flags': {
                'dae': {
                    'specialDuration': [
                        'combatEnd'
                    ]
                }
            }
        };
        await chris.createEffect(sourceActor, effectData1);
        if (!skipUses) bardicInspiration.update({'system.uses.value': bardicInspirationUses - 1});
        let bardicInspirationDie = sourceActor.system.scale.bard['bardic-inspiration'];
        if (skipUses) bardicInspirationDie = '1d6';
        if (!bardicInspirationDie) {
            ui.notifications.warn('Source actor does not appear to have a Bardic Inspiration scale!');
            queue.remove(this.item.uuid);
            return;
        }
        if (this.isCritical) {
            bardicInspirationDie = 2 + bardicInspirationDie.substring(1);
        }
        let damageType = this.item.system.damage.parts[0][1];
        let damageFormula = this.damageRoll._formula + ' + ' + bardicInspirationDie + '[' + damageType + ']';
        let damageRoll = await new Roll(damageFormula).roll({async: true});
        let bardicInspirationDieRoll = damageRoll.dice[damageRoll.dice.length - 1].total;
        await this.setDamageRoll(damageRoll);
        switch (selectedOption) {
            case 'DF':
                let feature2 = sourceActor.items.getName('Defensive Flourish');
                if (feature2) feature2.use();
                let effectData2 = {
                    'label': 'Defensive Flourish',
                    'icon': 'icons/skills/melee/swords-parry-block-blue.webp',
                    'duration': {'rounds': 1},
                    'changes': [
                        {
                            'key': 'system.attributes.ac.bonus',
                            'mode': 2,
                            'value': '+' + bardicInspirationDieRoll,
                            'priority': 20
                        }
                    ],
                    'origin': this.item.uuid,
                    'flags': {
                        'dae': {
                            'specialDuration': [
                                'combatEnd'
                            ]
                        }
                    }
                };
                await chris.createEffect(sourceActor, effectData2);
                break;
            case 'MF':
                let feature3 = sourceActor.items.getName('Mobile Flourish');
                if (feature3) feature3.use();
                break;
            case 'SF':
                let feature4 = await sourceActor.items.getName('Slashing Flourish');
                if (feature4) feature4.use();
                let nearbyTargets = chris.findNearby(this.token, 5, 'enemy');
                let hitTokenId = this.hitTargets.first().id;
                let removeIndex = nearbyTargets.findIndex(tok => tok.id === hitTokenId);
                if (removeIndex != -1) nearbyTargets.splice(removeIndex, 1);
                await chris.applyDamage([nearbyTargets], bardicInspirationDieRoll, damageType);
                break;
        }
        queue.remove(this.item.uuid);
    }
}