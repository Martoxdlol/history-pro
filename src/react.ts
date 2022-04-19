import HistoryPro, { Action, NavEvent, NavLocation } from ".";

export type To = {
    search: string
    pathname: string
    hash: string
}

export type ReactRouterNavigator = {
    pro: HistoryPro
    history: HistoryPro
    action: string
    location: NavLocation
    createHref: (to: string) => string
    push: (to: To, state?: any) => void
    pop: Function
    replace: (to: To, state?: any) => void
    go: (delta: number) => void
    back: Function
    forward: Function
    listen: Function
    block: Function
}


function createPath({ pathname = "/", search = "", hash = "", }) {
    if (search && search !== "?")
        pathname += search.charAt(0) === "?" ? search : "?" + search;
    if (hash && hash !== "#")
        pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
    return pathname;
}

export default function createHistory(historyPro?: HistoryPro): ReactRouterNavigator {
    let action = 'POP'

    if (!historyPro) historyPro = new HistoryPro({})

    let location = historyPro.location

    let listeners = new Set<Function>()

    historyPro.listen((e: NavEvent) => {
        location = e.nextLocation
        if (e.action === Action.push) {
            action = 'PUSH'
        } else if (e.action === Action.replace) {
            action = 'REPLACE'
        } else {
            action = 'POP'
        }

        if (e.isExit) {
            console.log("EXIT", e)
            return
        }

        listeners.forEach(listener => {
            listener({ location, action, event: e })
        })
    })


    let history: ReactRouterNavigator = {
        pro: historyPro,
        history: historyPro,
        get action() {
            return action;
        },
        get location() {
            return location
        },
        createHref(to: string | {}) {
            return typeof to === "string" ? to : createPath(to);
        },
        push: (to, state) => {
            historyPro.push(to.pathname + to.search + to.hash, state)
        },
        replace: (to, state) => {
            historyPro.replace(to.pathname + to.search + to.hash, state)
        },
        go: historyPro.go.bind(historyPro),
        pop: historyPro.pop.bind(historyPro),
        back: () => {
            historyPro.go(-1);
        },
        forward: () => {
            historyPro.go(1);
        },
        listen: (listener: Function) => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        block: (blocker: Function, options?: any) => {
            historyPro.block(() => {
                blocker()
            }, options)
        },
    }
    return history
}

