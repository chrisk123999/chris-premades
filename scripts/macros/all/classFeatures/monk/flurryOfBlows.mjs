async function jumpBonus({data}) {
    data.formula = '2 * ' + data.formula;
}
export const stepOfTheWindJump = {
    version: '2.0.4',
    rules: 'all',
    called: [
        {
            pass: 'actorJump',
            macro: jumpBonus,
            priority: 200
        }
    ]
};
