import constants from '../../../constants.mjs';
import {actorUtils, dialogUtils, documentUtils} from '../../../proxy.mjs';
async function spendHitDice({document: item, actor, data}) {
    if (data.activity?.item !== item) return;
    const features = constants.sangromancyFeatures.map(identifier => actorUtils.getItemByIdentifier(actor, identifier)).filter(feature => feature?.system?.uses?.value);
    const selections = await dialogUtils.selectHitDie(actor, item.name, '', {max: 2, additionalItems: features});
    if (!selections) return;
    await Promise.all(selections.filter(selection => selection.amount).map(({document, amount}) => {
        if (document.type === 'class') return documentUtils.update(document, {'system.hd.spent': document.system.hd.spent + amount});
        return documentUtils.update(document, {'system.uses.spent': document.system.uses.spent + amount});
    }));
}
export const wiltingSmite = {
    name: 'Wilting Smite',
    version: '2.0.4',
    rules: '2024',
    called: [
        {
            pass: 'actorAttackRiderUsed',
            macro: spendHitDice,
            priority: 50
        }
    ]
};
