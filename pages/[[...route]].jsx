import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Component } from 'react';

const statusStyles = {
  alignItems: 'center',
  color: '#4f2934',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '2rem',
  textAlign: 'center'
};

const cardStyles = {
  background: 'rgba(255, 255, 255, 0.92)',
  border: '1px solid rgba(148, 72, 91, 0.18)',
  borderRadius: '1.25rem',
  boxShadow: '0 1rem 3rem rgba(103, 45, 60, 0.12)',
  maxWidth: '34rem',
  padding: '2rem',
  width: '100%'
};

function ClientApplicationStatus({ error, retry }) {
  const hasError = Boolean(error);

  return (
    <main
      aria-live="polite"
      role={hasError ? 'alert' : 'status'}
      style={statusStyles}
    >
      <section style={cardStyles}>
        <h1 style={{ marginTop: 0 }}>
          {hasError ? 'No pudimos iniciar AdoptaLove' : 'Cargando AdoptaLove...'}
        </h1>
        <p>
          {hasError
            ? 'Ocurrió un problema al cargar la aplicación. Puedes volver a intentarlo.'
            : 'Estamos preparando las mascotas y servicios para ti.'}
        </p>
        {hasError && (
          <button
            onClick={() => (retry ? retry() : window.location.reload())}
            style={{
              background: '#9a4c63',
              border: 0,
              borderRadius: '999px',
              color: '#fff',
              cursor: 'pointer',
              font: 'inherit',
              fontWeight: 700,
              padding: '0.75rem 1.25rem'
            }}
            type="button"
          >
            Reintentar
          </button>
        )}
      </section>
    </main>
  );
}

class ClientApplicationBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AdoptaLove no pudo renderizarse.', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <ClientApplicationStatus
          error={this.state.error}
          retry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

const ClientApplication = dynamic(() => import('../frontend/src/App'), {
  loading: ClientApplicationStatus,
  ssr: false
});

export default function AdoptaLovePage() {
  return (
    <>
      <Head>
        <title>AdoptaLove</title>
        <meta
          name="description"
          content="Adopción responsable de mascotas en Chile."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ClientApplicationBoundary>
        <ClientApplication />
      </ClientApplicationBoundary>
    </>
  );
}
