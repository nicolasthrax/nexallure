import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', backgroundColor: '#0d0d0d', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600 }}>
            Something went wrong.
          </p>
          <p style={{ color: '#999999', fontSize: '14px' }}>
            Please refresh the page. If the problem continues, contact hello@nexallure.com
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '8px', padding: '10px 24px', backgroundColor: 'var(--seal-on-ink)',
              color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer',
              fontWeight: 600, fontSize: '14px' }}>
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
