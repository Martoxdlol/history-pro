import NavKeysController, { NavigationEvent } from "nav-keys";

export type Options = {
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

export type BlockOptions = {
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

export type Blocker = {
    blocker: Function
    options: BlockOptions
    cancel: Function
}

export type Listener = {
    listener: Function
    cancel: Function
}

export const DEFAULT_OPTIONS: Options = {
    listenPushPopAndReplaceEvents: true,
    listenManuallyCalledBackOrForward: true,
    treatHashchangeAsPush: false,
}

export enum Action {
    push = 'push',
    pop = 'pop',
    back = 'back',
    forward = 'forward',
    replace = 'replace',
    exit = 'exit',
    hashchange = 'hashchange',
}

export class NavLocation {
    state: any
    key: string
    readonly url: URL
    constructor(url: string | URL, state?: any, key?: string) {
        this.url = new URL(url)
        this.state = state ?? null
        this.key = key ?? createKey()
    }

    get hash() {
        return this.url.href
    }
    get host() {
        return this.url.host
    }
    get hostname() {
        return this.url.hostname
    }
    get href() {
        return this.url.href
    }
    get origin() {
        return this.url.origin
    }
    get pathname() {
        return this.url.pathname
    }
    get port() {
        return this.url.port
    }
    get protocol() {
        return this.url.protocol
    }

    toString() {
        return this.url.toString()
    }
}

export class NavEvent {
    n: number
    prevLocation: NavLocation
    nextLocation: NavLocation
    action: Action
    isBack: boolean
    isForward: boolean
    isReplace: boolean
    isPush: boolean
    isPop: boolean
    isExit: boolean
    isHashchange: boolean
    wasManuallyCalledAction: boolean
    setCancelled?: Function
    stopPropagation?: Function
    setContinue?: Function
}

export default class HistoryPro {
    private navKeysController: NavKeysController
    private list: NavLocation[]
    private listeners: Set<Listener>
    private blockers: Set<Blocker>
    private exitBlockersCount: number
    private pushReplaceAndPopBlockersCount: number
    readonly options: Options
    private index: number

    constructor(options?: Options) {
        this.options = { ...DEFAULT_OPTIONS, ...options }
        this.navKeysController = options.navKeysController ?? new NavKeysController(window.history, {})
        this.navKeysController.listen(this.handleListen.bind(this))
        this.listeners = new Set()
        this.blockers = new Set()
        this.exitBlockersCount = 0
        this.pushReplaceAndPopBlockersCount = 0

        this.list = [
            new NavLocation(this.navKeysController.url, options.initialState, options.initialKey)
        ]
        this.index = 0
    }

    // Handles back, forward and hashchange events
    private handleListen(event: NavigationEvent) {
        // First, create event
        let newIndex = this.index
        if (event.action === 'back') newIndex--
        if (event.action === 'forward') newIndex++
        if (newIndex > this.list.length - 1) {
            newIndex = this.list.length - 1
            this.navKeysController.disableForwardButton()
            return
        }
        const isExit = newIndex == -1
        const isHashchange = event.action === 'hashchange'

        const location = !isExit ? this.list[newIndex] : null

        let action = Action.back
        if (event.action == 'forward') action = Action.forward
        if (event.action == 'hashchange') action = Action.hashchange
        if (isExit) action = Action.exit

        const e: NavEvent = {
            n: 0,
            isBack: event.action === 'back',
            isForward: event.action === 'forward',
            isPop: false,
            isReplace: false,
            isPush: false,
            isExit,
            prevLocation: this.location,
            nextLocation: location,
            isHashchange,
            action,
            wasManuallyCalledAction: false,
        }

        if (e.isBack) e.n = -1
        if (e.isForward) e.n = 1

        // Second consider blocker
        const blocked = this.emitBlocker(e)

        if (blocked) return

        // Hash change
        if (this.options.treatHashchangeAsPush && event.action === 'hashchange') {
            this.push(this.navKeysController.url)
            return
        }

        const cancelled = this.emitEvent(e)

        if (!cancelled) {
            // Establish new index
            if (!e.isExit) this.index = newIndex
            if (this.index == this.length - 1) this.navKeysController.disableForwardButton()
            if (this.index < this.length - 1 && !this.navKeysController.isForwardButtonEnabled) this.navKeysController.enableForwardButton()
            setTimeout(() => { this.navKeysController.url = this.url }, 100)
            if (e.isExit) this.navKeysController.exit()
        }
    }

    /*Goes back or forward on history list by n quantity.
    Doesn't modify history's list.*/
    go(n: number) {
        // Verifications
        if (n === 0) return
        let newIndex = this.index + n
        if (n > newIndex - 1) n = newIndex - 1

        const isExit = newIndex >= 0
        const isBack = n < 0 && !isExit
        const isForward = !isBack && isExit
        let action = Action.exit
        if (isBack) action = Action.back
        if (isForward) action = Action.forward

        this.index = newIndex
        const e: NavEvent = {
            n,
            action,
            isBack,
            isForward,
            isExit,
            isPop: false,
            isHashchange: false,
            isPush: false,
            isReplace: false,
            prevLocation: this.location,
            nextLocation: this.list[newIndex] ?? null,
            wasManuallyCalledAction: true,
        }

        const shouldDoAction = this.emitEventAndBlockers(e)
        if (!shouldDoAction) return

        if (n < 0) {
            this.navKeysController.exit()
            return
        }
        this.index = newIndex
        this.navKeysController.url = this.url
    }

    /*Goes forward on history list.
    Doesn't modify history's list.*/
    forward() {
        this.go(1)
    }

    /*Goes backward on history list.
    Doesn't modify history's list.*/
    back() {
        this.go(-1)
    }

    /*Adds a navigation next to the actual position.
    Removes all forward navigations items.*/
    push(url: string | URL, state?: any, position?: number) {
        if (position === undefined || position === null) position = this.index + 1
        // Next new location
        const location: NavLocation = new NavLocation(new URL(url, this.url), state, createKey())
        let n = 0
        let newIndex = this.index
        if (position - 1 == this.index) {
            // Should go to
            n = 1
            newIndex++
        }
        if (position - 1 < this.index) {
            newIndex++
        }
        const e: NavEvent = {
            n: 0,
            action: Action.push,
            isBack: false,
            isExit: false,
            isForward: false,
            isHashchange: false,
            isPop: false,
            isPush: true,
            isReplace: false,
            prevLocation: this.list[position],
            nextLocation: location,
            wasManuallyCalledAction: true,
        }

        const shouldDoAction = this.emitEventAndBlockers(e)
        if (!shouldDoAction) return

        this.index = newIndex
        this.list = [...this.list.slice(0, position), location, ...this.list.slice(position)]
        this.navKeysController.url = this.url
    }


    /*Replaces current navigation item*/
    replace(url: string | URL, state?: any, position?: number) {
        if (position === undefined || position === null) position = this.index
        // Next new location
        const location: NavLocation = new NavLocation(new URL(url, this.url), state, createKey())

        const e: NavEvent = {
            n: 0,
            action: Action.replace,
            isBack: false,
            isExit: false,
            isForward: false,
            isHashchange: false,
            isPop: false,
            isPush: false,
            isReplace: true,
            prevLocation: this.list[position],
            nextLocation: location,
            wasManuallyCalledAction: true,
        }

        const shouldDoAction = this.emitEventAndBlockers(e)
        if (!shouldDoAction) return

        this.list[position] = location
        this.navKeysController.url = this.url
    }

    /*Removes current position and goes back*/
    pop(position?: number) {
        if (position === undefined || position === null) {
            position = this.index
        }

        const isExit = this.list.length == 1

        let newIndex = this.index
        let nextLocationIndex = newIndex


        let n = 0

        if (position <= this.index) {
            if (position == 0) {
                n = 1
                nextLocationIndex = 1
            } else {
                n = -1
                newIndex--
                nextLocationIndex--
            }
        }

        const isForward = n > 0
        const isBack = n < 0

        const e: NavEvent = {
            n,
            action: Action.pop,
            isBack,
            isExit,
            isForward,
            isHashchange: false,
            isPop: true,
            isPush: false,
            isReplace: false,
            prevLocation: this.location,
            nextLocation: this.list[nextLocationIndex],
            wasManuallyCalledAction: true,
        }

        const shouldDoAction = this.emitEventAndBlockers(e)
        if (!shouldDoAction) return

        // Do the action
        this.list.splice(position, 1)
        this.navKeysController.url = this.url
    }

    /*Listen for all the events*/
    listen(listener: Function) {
        const b: Listener = {
            listener,
            cancel: () => {
                this.listeners.delete(b)
            }
        }

        this.listeners.add(b)
        return b.cancel
    }

    /*Block back and forward actions. Doesn't block push, pop or replace by default*/
    block(blocker: Function, options?: BlockOptions): Function {
        if (!options) options = {}

        const b: Blocker = {
            blocker,
            options,
            cancel: () => {
                this.blockers.delete(b)
                if (!options.doNotPreventExit) {
                    this.exitBlockersCount--
                }
                if (options.blockPushPopAndReplace) {
                    this.pushReplaceAndPopBlockersCount--
                }
                if (this.exitBlockersCount == 1) {
                    // REMOVE NATIVE TAB CLOSE BLOCKER
                }
            }
        }

        if (!options.doNotPreventExit) {
            this.exitBlockersCount++
        }
        if (options.blockPushPopAndReplace) {
            this.pushReplaceAndPopBlockersCount++
        }
        if (this.exitBlockersCount == 1) {
            // ADD NATIVE TAB CLOSE BLOCKER
        }

        this.blockers.add(b)
        return b.cancel
    }

    clearBlockers() {
        this.exitBlockersCount = 0
        this.pushReplaceAndPopBlockersCount = 0
        this.blockers.clear()
    }

    /* Navigation history length */
    get length(): number {
        return this.list.length
    }

    get location(): NavLocation {
        return this.list[this.index]
    }

    get currentIndex() {
        return this.index
    }

    get url() {
        return this.location.url
    }

    /* Get a navigation item at list position*/
    get(position: number): NavLocation {
        return this.list[position] || null
    }

    private emitEventAndBlockers(e: NavEvent): boolean {
        // Emit blockers
        const blocked = this.emitBlocker(e)
        if (blocked) return false;

        // Emit event
        const cancelled = this.emitEvent(e)
        if (cancelled) return false;

        return true
    }
    /* returns true if blocked */
    private emitBlocker(e: NavEvent): boolean {
        let blocked = false
        let _continue = false
        const blockers = Array.from(this.blockers.values())

        // Check some events faster
        if (this.pushReplaceAndPopBlockersCount == 0 && !e.isBack && !e.isForward && !e.isExit && !e.isHashchange) {
            return false
        }
        if (this.exitBlockersCount == 0 && e.isExit) {
            return false
        }

        while (blockers.length > 0) {
            const blocker = blockers.pop()
            let block = false
            if (!blocker.options.doNotBlockBack && e.isBack) block = true
            if (!blocker.options.doNotBlockForward && e.isForward) block = true
            if (!blocker.options.doNotPreventExit && e.isExit) block = true
            if (blocker.options.blockPushPopAndReplace && (e.isPop || e.isReplace || e.isPush)) block = true

            if (!block) continue

            /* use: setContinue(true) to bypass block */
            e.setContinue = (c: boolean) => _continue = c

            blocker.blocker(e, blocker.cancel)

            blocked = true
            break
        }

        return blocked && (!_continue)
    }

    private emitEvent(e: NavEvent): boolean {
        if (!this.options.listenPushPopAndReplaceEvents && (e.isPop || e.isReplace || e.isPush) && e.wasManuallyCalledAction) return

        let cancelled = false
        let stoppedPropagation = false
        // Launch event
        e.setCancelled = (b: boolean) => cancelled = b
        e.stopPropagation = () => stoppedPropagation = true
        const list = Array.from(this.listeners.values())

        if (this.options.callEventListenersFromLastToFirst) list.reverse()

        for (const listener of list) {
            listener.listener(e)
            if (stoppedPropagation) break
        }

        return cancelled
    }
}

function createKey() {
    return Math.random().toString(36).substring(2, 8);
}