import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto min-h-screen flex flex-col items-center justify-center p-8">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-blue-600">Chifa.ai</h1>
        <p className="text-xl text-gray-700 mt-4">
          Interrogez votre base de données pharmacie en langage naturel.
        </p>
      </header>

      <main className="text-center">
        <p className="text-lg mb-8">
          Obtenez des réponses instantanées et des insights précieux à partir de vos données locales,
          de manière sécurisée et efficace.
        </p>
        <div className="space-x-4">
          <Link
            href="/pricing"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-lg shadow-md transition duration-150 ease-in-out"
          >
            Voir les Plans (Pricing)
          </Link>
          <Link
            href="/login"
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg text-lg shadow-md transition duration-150 ease-in-out"
          >
            Se Connecter
          </Link>
        </div>
      </main>

      <footer className="mt-16 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} Chifa.ai. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
