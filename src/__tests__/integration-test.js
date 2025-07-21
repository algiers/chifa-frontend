
// Test d'intégration simple pour l'API de chat
async function testChatAPI() {
  const testMessage = {
    messages: [
      { id: '1', role: 'user', content: 'Bonjour, comment allez-vous?' }
    ],
    conversationId: null
  };
  
  try {
    const response = await fetch('/api/chat/chifa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });
    
    if (response.ok) {
      console.log('✅ API de chat fonctionne');
      return true;
    } else {
      console.log('❌ Erreur API:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return false;
  }
}

// Utilisation: testChatAPI().then(result => console.log('Test result:', result));
