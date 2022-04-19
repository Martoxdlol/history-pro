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
        createHref: historyPro.createHref.bind(historyPro),
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

            // if (blockers.length === 1) {
            //     window.addEventListener(BeforeUnloadEventType, promptBeforeUnload);
            // }

            // return function () {
            //     unblock();

            //     // Remove the beforeunload listener so the document may
            //     // still be salvageable in the pagehide event.
            //     // See https://html.spec.whatwg.org/#unloading-documents
            //     if (!blockers.length) {
            //         window.removeEventListener(BeforeUnloadEventType, promptBeforeUnload);
            //     }
            // };
        },
    }
    return history
}

export function makeNativeHistoryPro(historyPro?: HistoryPro) {

}