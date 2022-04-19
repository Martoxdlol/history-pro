History Pro. A better replacement for native history api
=================

It uses interanlly this module: [nav-keys](https://www.npmjs.com/package/nav-keys)

**CAUTION: this package isn´t complete and tested. It can catastrophically fail.**

```javascript
import HistoryPro from 'history-pro'

const historyPro = new HistoryPro(options /* see below */)

const cancel = historyPro.listen(e => {
    console.log(e)
    if(e.action == 'push') {
        // Add view to UI
        UI.addView(Views[e.nextLocation.pathname])
    }

    if(e.isBack) {
        UI.hideView()
    }

    if(e.isReplace) {
        UI.replaceView()
    }
})

homeBtn.onclick = () => historyPro.push('home')

cartBtn.onClick = () => historyPro.push('cart', {item:[...], price: 200, code: ...})

checkoutBtn.onClick = () => historyPro.push('checkout', {cart: {...}})
CheckoutProcess.onFinish = () => historyPro.replace('checkout/finished', {code: ...}) // Cant go back and see previous steps anymore

function openModal() {
    const cancel = historyPro.block((e, cancel) => {
        if(e.isBack) UI.closeModal()
        cancel()
    })
    // Open modal on UI
    UI.openModal({ onClose: () => cancel() })
}

```

```typescript

class HistoryPro {
    readonly options: Options; /* See below */

    constructor(options?: Options);
    /* Go n routes back and forward. Ej: go(-1) is equal to back() */
    go(n: number): void;
    /* Go to a specific index on history stack, or to the index of a NavLocation instance that already exists on the stack */
    goTo(position_or_navLocation: number | NavLocation): void;
    /* Go one position forward. Equal to: go(1) */
    forward();
    /* Go one position back. Equal to: go(-1) */
    back();
    /* Adds another location to the stack. If position is equal to currentIndex, it will be also a navigation event. by default, position is currentIndex */
    push(url, state?, position?);
    /* Replaces location at position on the stack. by default, position is currentIndex */
    replace(url, state?, position?);
    /* Removes a location from the stack at position (or current position) */
    pop(position?);
    /* Listen events */
    listen(listener: Function): Function/* unsubscribe function */;
    /* Adds a blocker, it will prevent from chaning location */
    block(blocker: Function, options?: BlockOptions): Function/* unsubscribe function */;
    /* Remove all blockers */
    clearBlockers();
    /* Hsitory stack length */
    get length(): number;
    /* Current location */
    get location(): NavLocation;
    /* current index on history stack (isn't really a stack) */
    get currentIndex(): number;
    /* current url */
    get url();
    /* current state */
    get state();
    /* get location of specific stack index */
    get(position: number): NavLocation;
    /* Index of NavLocation instance */
    indexOf(navLocation: NavLocation): number;
}

```

## Internet Explorer Compatibility

```html
    <script src="https://cdn.polyfill.io/v2/polyfill.min.js"></script>
    <script src="history-pro.js"></script>

    <script>

    var historyPro = new HistoryPro()
    
    </script>
```


```typescript
class NavEvent {
    /* Differential of routes navigated. 
    Ej: back() -> n: -1
    forward(); forward() -> n: 2
    */
    n: number
    /* Previous or affected location */
    prevLocation: NavLocation
    /* New added/changed to location */
    nextLocation: NavLocation
    /* push | pop | back | forward | replace | exit | hashchange */
    action: Action
    /* is back action. (it can be part of pop event too) */
    isBack: boolean
    /* is forward action. (it can be part of pop or push event too) */
    isForward: boolean
    /* Is replace action */
    isReplace: boolean
    /* Is push action. (push adds a route, normally it includes a location change) */
    isPush: boolean
    /* Is pop action. (pop removes a route, also it can be with it a back or forward action */)
    isPop: boolean
    /* It happen when going back on the first location */
    isExit: boolean
    /* Is the event a hash change? */
    isHashchange: boolean
    /* Was the event trigger by code or brower itself? (ej: back and forward) */
    wasManuallyCalledAction: boolean
    /* setCancelled(true) to cancel the event */
    setCancelled?: Function
    /* Prevent triggering other event listeners */
    stopPropagation?: Function
    /* It can be used to ignore block. Ej: setContinue(true)*/
    setContinue?: Function 
}


type Options = {
    /* If for some reason you are using your own instance or version of 'nav-keys' package (search it on npm) */
    navKeysController?: NavKeysController
    /* This events are emitted when called intentionally by code*/
    listenPushPopAndReplaceEvents?: boolean
    /* This events are emitted when called intentionally by code, not when clicked browser navigation keys*/
    listenManuallyCalledBackOrForward?: boolean
    /* First navigation item state */
    initialState?: any
    /* First navigation item key */
    initialKey?: string
    /* When some link that triggers a hash change, it will be trated as push() */
    treatHashchangeAsPush?: boolean
    /* call event listener from last to first (like a stack) */
    callEventListenersFromLastToFirst?: boolean
}

type BlockOptions = {
    // When event triggered, callback is deleted and stops blocking
    once?: boolean
    // It doesn't block forward action
    doNotBlockForward?: boolean
    // It doesn't block back action
    doNotBlockBack?: boolean
    // It doesn't block push, pop, or replace actions
    blockPushPopAndReplace?: boolean
    // It will not show confirmation message when closing tab
    doNotPreventExit?: boolean
}

class NavLocation {
    state: any;
    key: string;
    readonly url: URL;
    constructor(url: string | URL, state?: any, key?: string);
    get path(): string;
    get hash(): string;
    get pathname(): string;
    get search(): string;
    toString(): string;
}
```