let {RollResolver} = foundry.applications.dice;
class CPRRollResolver extends RollResolver {
    constructor(roll, options={}) {
        console.log('This is the roll resolver!!!!!!!!!!!');
        console.log(roll, options);
        super(roll, options);
        console.log(this);
    }
    static DEFAULT_OPTIONS = {
        id: 'cpr-roll-resolver-{id}',
        tag: 'form',
        classes: ['cpr-roll-resolver'],
        window: {
            title: 'CPR Roll Resolver',
        },
        position: {
            width: 500,
            height: 'auto'
        },
        form: {
            submitOnChange: false,
            closeOnSubmit: false,
            handler: this._fulfillRoll
        }
    };
    #resolve;
    async awaitFulfillment() {
        console.log('Awaiting');
        console.log(this.roll);
        if (this.roll instanceof CONFIG.Dice.DamageRoll) {
            console.log('is damage');
            Roll.defaultImplementation.RESOLVERS.delete(this.roll);
            this.#resolve?.();
            return;
        } else {
            console.log('not damage');
            await super.awaitFulfillment();
        }
    }
    render(options) {
        console.log('render options', options);
        if (this.roll instanceof CONFIG.Dice.DamageRoll) {
            this.close();
        } else super.render(options);
    }
    registerResult(method, denomination, result) {
        console.log(method, denomination, result);
        return super.registerResult(method, denomination, result);
    }
}
export function register() {
    console.log('!!!!!!!!!!!!!registering!!!!!!!!!!!!!!!!');
    CONFIG.Dice.fulfillment.methods.chrispremades = {
        label: 'Chris Premades Test',
        icon: '<i class="fa-solid fa-kit-medical"></i>',
        interactive: true,
        resolver: CPRRollResolver
    };
    CONFIG.Dice.fulfillment.defaultMethod = 'chrispremades';
}