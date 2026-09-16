export class HashRouter {
  constructor({ resolve, fallback = 'erpDashboard' }) {
    this.resolveRoute = resolve;
    this.fallback = fallback;
  }

  current() {
    return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)[0] || this.fallback;
  }

  start() {
    window.addEventListener('hashchange', () => this.resolveRoute(this.current()));
    this.resolveRoute(this.current());
  }
}
