import {actorUtils, automationUtils, tokenUtils} from '../../../../proxy.mjs';
async function save({document: item, actor, config}) {
    const token = actorUtils.getFirstToken(actor);
    if (!token) return;
    const bonus = Math.min(tokenUtils.findNearby(token, 5, {disposition: 'enemy'}).filter(nearby => nearby.actor?.system.attributes.hp.value > 0).length, automationUtils.getConfigValues(item, ['max']).max);
    if (!bonus) return;
    config.rolls ??= [{}];
    config.rolls[0].parts ??= [];
    config.rolls[0].parts.push(String(bonus));
}
export const combatMasteryInexorable = {
    name: 'Combat Mastery: Inexorable',
    version: '2.1.10',
    rules: '2014',
    save: [
        {
            pass: 'actorSituational',
            macro: save,
            priority: 50
        }
    ],
    config: {
        max: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Config.Max',
            category: 'homebrew'
        }
    }
};
