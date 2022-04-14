import HistoryPro from ".";

declare global {
    interface Window { HistoryPro: any; }
}

window.HistoryPro = HistoryPro