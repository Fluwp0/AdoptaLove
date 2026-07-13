import dynamic from 'next/dynamic';
import Head from 'next/head';

const ClientApplication = dynamic(() => import('../frontend/src/App'), {
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
      <ClientApplication />
    </>
  );
}
