import {dialogUtils, documentUtils} from '../../../../proxy.mjs';
async function use({document, actor, token}) {
    const validItems = actor.items.filter(item => {
        const uses = item.system.uses;
        if (!uses || !uses.max) return false;
        if (uses.value >= uses.max) return false;
        return uses.recovery?.some(r => r.period === 'lr');
    });
    if (!validItems.length) return;
    let selection;
    if (validItems.length === 1) {
        selection = validItems[0];
    } else {
        selection = await dialogUtils.selectDocumentDialog(document.name, 'CHRISPREMADES.Macros.Modern.ExtremeResilience.Select', validItems, {max: 1, showUses: true});
    }
    if (!selection) return;
    await documentUtils.update(selection, {'system.uses.spent': selection.system.uses.spent - 1});
}
export const extremeResilience = {
    name: 'Extreme Resilience',
    version: '2.0.3',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};