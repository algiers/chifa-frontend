import Link from 'next/link';
import React from 'react';

interface PlanProps {
  name: string;
  price: string;
  features: string[];
  actionText: string;
  actionLink: string;
  isFeatured?: boolean;
}

const PlanCard: React.FC<PlanProps> = ({ name, price, features, actionText, actionLink, isFeatured }) => {
  return (
    <div className={`border rounded-lg p-6 shadow-lg ${isFeatured ? 'border-blue-500 scale-105 bg-blue-50' : 'border-gray-300'}`}>
      <h2 className={`text-2xl font-bold mb-4 ${isFeatured ? 'text-blue-600' : 'text-gray-800'}`}>{name}</h2>
      <p className="text-4xl font-extrabold mb-6">{price}<span className="text-base font-normal text-gray-500">{name !== "Entreprise" ? "/mois" : ""}</span></p>
      <ul className="space-y-2 mb-8 text-gray-600">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={actionLink}
        className={`w-full text-center py-3 px-6 rounded-lg font-semibold transition duration-150 ease-in-out
                    ${isFeatured ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
      >
        {actionText}
      </Link>
    </div>
  );
};

export default function PricingPage() {
  const plans: PlanProps[] = [
    {
      name: 'Démo Gratuite',
      price: '0 DA',
      features: [
        '3 requêtes IA',
        'Accès à votre base de données',
        'Support communautaire',
      ],
      actionText: 'Commencer Gratuitement',
      actionLink: '/register?plan=free_demo', // L'utilisateur s'inscrit, puis complète les infos pharmacie
    },
    {
      name: 'Pro Pharmacie',
      price: '4,900 DA',
      features: [
        'Requêtes IA illimitées',
        'Historique des conversations',
        'Visualisation des données (Basique)',
        'Support prioritaire par email',
      ],
      actionText: 'Choisir Pro',
      actionLink: '/register?plan=pro_monthly', // S'il n'est pas loggué, ou vers formulaire pharmacie si loggué
      isFeatured: true,
    },
    {
      name: 'Entreprise',
      price: 'Sur Devis',
      features: [
        'Fonctionnalités Pro Pharmacie',
        'Support dédié et SLA',
        'Personnalisations avancées',
        'Formation et onboarding',
      ],
      actionText: 'Nous Contacter',
      actionLink: '/contact', // À créer
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Des plans adaptés à chaque pharmacie
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Commencez gratuitement ou choisissez un plan pour débloquer tout le potentiel de Chifa.ai.
        </p>
      </div>

      <div className="mt-16 max-w-5xl mx-auto grid gap-8 lg:grid-cols-3 lg:max-w-none">
        {plans.map((plan) => (
          <PlanCard key={plan.name} {...plan} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
          &larr; Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
