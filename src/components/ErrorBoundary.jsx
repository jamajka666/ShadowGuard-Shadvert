import { Component } from 'react';

/**
 * Dad-path stability: never leave a senior on a blank white screen.
 * SGW-005 D-P1-2 / Trust Sprint.
 * Plain JSX so tsc does not require @types/react class Component support.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message ? String(error.message).slice(0, 200) : undefined,
    };
  }

  componentDidCatch(error, info) {
    console.error('[ShadowGuard] UI error boundary:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}
      >
        <div
          className="max-w-md w-full rounded-2xl p-8 shadow-xl"
          style={{ background: '#1e293b', border: '1px solid #334155' }}
        >
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
            ShadowGuard Shadvert
          </p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Aplikace se na chvíli zastavila
          </h1>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.5, color: '#e2e8f0', marginBottom: '1.5rem' }}>
            To se stává výjimečně. Vaše data na serveru jsme tím neztratili. Zkuste stránku znovu
            načíst — obvykle to stačí.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                padding: '0.9rem 1.25rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: '#22c55e',
                color: '#052e16',
                fontWeight: 700,
                fontSize: '1.05rem',
                cursor: 'pointer',
              }}
            >
              Znovu načíst aplikaci
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '0.75rem',
                border: '1px solid #475569',
                background: 'transparent',
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Úvodní stránka
            </button>
          </div>
          {this.state.message ? (
            <p
              style={{
                marginTop: '1.25rem',
                fontSize: '0.75rem',
                color: '#64748b',
                wordBreak: 'break-word',
              }}
            >
              Technický detail: {this.state.message}
            </p>
          ) : null}
        </div>
      </div>
    );
  }
}
