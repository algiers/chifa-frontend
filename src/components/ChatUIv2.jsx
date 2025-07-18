import { useState } from "react";

const mockMessages = [
  { sender: "user", content: "Combien de factures ont été traitées en avril 2025 ?" },
  { sender: "ai", content: "En avril 2025, 364 factures ont été traitées.\n\nCe résultat provient du comptage des enregistrements dans la table \"facture\" dont la date est comprise entre le 1er avril et le 30 avril 2025.\n\nLe chiffre semble plausible pour un mois d'activité normale." },
  { sender: "ai", content: "{\n  \"count\": 364\n}" },
];

export default function ChatUIv2() {
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "user", content: input }]);
    setInput("");
    // Ici, tu peux intégrer la logique backend/API pour obtenir la réponse IA
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-4 flex flex-col justify-between">
        <div>
          <h1 className="text-xl font-bold mb-6">Chifa.ai</h1>
          <button className="bg-green-600 px-4 py-2 rounded w-full mb-4">
            Nouveau Chat
          </button>
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none mb-6"
          />
          <div className="space-y-2 text-sm">
            <div className="text-gray-300">CA CNAS Janvier - Aujourd'hui</div>
            <div className="text-gray-400">Combien de factures... - 3 jours</div>
            <div className="text-gray-400">Combien de factures... - 6 jours</div>
          </div>
        </div>
        <div className="text-sm space-y-2">
          <button className="w-full text-left text-gray-400 hover:text-white">
            Paramètres
          </button>
          <button className="w-full text-left text-gray-400 hover:text-white">
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1 p-6 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 pr-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl max-w-xl whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-green-600 text-right ml-auto"
                  : "bg-gray-700 text-left"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        {/* Input bar */}
        <div className="mt-4 border-t border-gray-700 pt-4">
          <div className="flex">
            <textarea
              className="flex-1 resize-none p-3 rounded-lg bg-gray-800 text-white focus:outline-none"
              placeholder="Posez votre question en langage naturel..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            ></textarea>
            <button
              onClick={sendMessage}
              className="ml-2 bg-green-600 p-3 rounded-lg hover:bg-green-700"
            >
              ➤
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}