import 'jquery';

declare global {
    interface JQuery {
        carousel(action?: string): JQuery;
    }
}
