import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Send, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguageStore } from '../store/languageStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const BibleQA: React.FC = () => {
  const { t, language } = useLanguageStore();
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;
    
    // Add user question to conversation
    const userQuestion = question;
    setConversation(prev => [...prev, { role: 'user', content: userQuestion }]);
    setQuestion('');
    setIsLoading(true);
    
    try {
      // Call DeepSeek API
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-b266b9a9f1d143acb5bac4eef1e1be12'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are a knowledgeable Bible scholar and spiritual advisor. 
              Your purpose is to provide accurate, thoughtful answers to questions about the Bible, 
              Christian theology, and spiritual matters. Always cite relevant scripture references 
              when answering questions. Be respectful of different Christian denominations and 
              interpretations. When uncertain, acknowledge the range of interpretations rather than 
              presenting one view as definitive. Focus on providing spiritual guidance and biblical 
              knowledge rather than personal opinions. ${language === 'es' ? 'Please respond in Spanish.' : 'Please respond in English.'}`
            },
            ...conversation.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: userQuestion
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      setConversation(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Error fetching response:', error);
      
      // Fallback to predefined responses if API fails
      const lowerQuestion = userQuestion.toLowerCase();
      let fallbackResponse = '';
      
      if (language === 'es') {
        // Spanish fallback responses
        if (lowerQuestion.includes('perdón') || lowerQuestion.includes('perdonar')) {
          fallbackResponse = "La Biblia enseña que el perdón es central para la fe cristiana. En Mateo 6:14-15, Jesús dice: 'Porque si perdonáis a los hombres sus ofensas, os perdonará también a vosotros vuestro Padre celestial; mas si no perdonáis a los hombres sus ofensas, tampoco vuestro Padre os perdonará vuestras ofensas.' Además, Efesios 4:32 anima a los creyentes a 'Sed benignos unos con otros, misericordiosos, perdonándoos unos a otros, como Dios también os perdonó a vosotros en Cristo.'";
        } else if (lowerQuestion.includes('amor') || lowerQuestion.includes('amar')) {
          fallbackResponse = "Jesús identificó el amor como el mandamiento más importante. En Mateo 22:37-39, Él dijo: 'Amarás al Señor tu Dios con todo tu corazón, y con toda tu alma, y con toda tu mente. Este es el primero y grande mandamiento. Y el segundo es semejante: Amarás a tu prójimo como a ti mismo.' En 1 Corintios 13, Pablo elabora sobre la naturaleza del amor, describiéndolo como paciente, bondadoso, no envidioso, no jactancioso, no orgulloso, no deshonroso, no egoísta, no fácilmente irritable, y que no guarda registro de agravios.";
        } else if (lowerQuestion.includes('salvación') || lowerQuestion.includes('salvar')) {
          fallbackResponse = "La Biblia enseña que la salvación viene a través de la fe en Jesucristo. Efesios 2:8-9 afirma: 'Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se gloríe.' Juan 3:16 declara famosamente: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.'";
        } else if (lowerQuestion.includes('oración') || lowerQuestion.includes('orar')) {
          fallbackResponse = "La oración es comunicación con Dios. Jesús enseñó a Sus discípulos a orar en Mateo 6:9-13 con lo que ahora llamamos el Padre Nuestro. En 1 Tesalonicenses 5:17, Pablo anima a los creyentes a 'orar sin cesar.' Santiago 5:16 enseña que 'La oración eficaz del justo puede mucho.' Jesús también enfatizó la importancia de la oración privada en Mateo 6:6, diciendo: 'Mas tú, cuando ores, entra en tu aposento, y cerrada la puerta, ora a tu Padre que está en secreto; y tu Padre que ve en lo secreto te recompensará en público.'";
        } else if (lowerQuestion.includes('sufrimiento') || lowerQuestion.includes('dolor')) {
          fallbackResponse = "La Biblia aborda el sufrimiento en varios pasajes. Romanos 8:18 dice: 'Pues tengo por cierto que las aflicciones del tiempo presente no son comparables con la gloria venidera que en nosotros ha de manifestarse.' Santiago 1:2-4 anima a los creyentes a 'Tened por sumo gozo, hermanos míos, el que os halléis en diversas pruebas, sabiendo que la prueba de vuestra fe produce paciencia. Mas tenga la paciencia su obra completa, para que seáis perfectos y cabales, sin que os falte cosa alguna.' En 2 Corintios 12:9, Dios le dice a Pablo: 'Bástate mi gracia; porque mi poder se perfecciona en la debilidad.'";
        } else {
          fallbackResponse = "Esa es una pregunta interesante sobre la Biblia. Aunque no tengo una referencia bíblica específica para ese tema exacto, te animo a explorar pasajes tanto en el Antiguo como en el Nuevo Testamento que podrían abordar esto. La Biblia contiene sabiduría sobre casi todos los aspectos de la experiencia humana. ¿Te gustaría que te sugiriera algunos libros de la Biblia que podrían ser relevantes para tu pregunta?";
        }
      } else {
        // English fallback responses
        if (lowerQuestion.includes('forgiveness')) {
          fallbackResponse = "The Bible teaches that forgiveness is central to the Christian faith. In Matthew 6:14-15, Jesus says, 'For if you forgive other people when they sin against you, your heavenly Father will also forgive you. But if you do not forgive others their sins, your Father will not forgive your sins.' Additionally, Ephesians 4:32 encourages believers to 'Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.'";
        } else if (lowerQuestion.includes('love') || lowerQuestion.includes('greatest commandment')) {
          fallbackResponse = "Jesus identified love as the greatest commandment. In Matthew 22:37-39, He said, 'Love the Lord your God with all your heart and with all your soul and with all your mind. This is the first and greatest commandment. And the second is like it: Love your neighbor as yourself.' In 1 Corinthians 13, Paul elaborates on the nature of love, describing it as patient, kind, not envious, not boastful, not proud, not dishonoring others, not self-seeking, not easily angered, and keeping no record of wrongs.";
        } else if (lowerQuestion.includes('salvation') || lowerQuestion.includes('saved')) {
          fallbackResponse = "The Bible teaches that salvation comes through faith in Jesus Christ. Ephesians 2:8-9 states, 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—not by works, so that no one can boast.' John 3:16 famously declares, 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'";
        } else if (lowerQuestion.includes('prayer') || lowerQuestion.includes('pray')) {
          fallbackResponse = "Prayer is communication with God. Jesus taught His disciples to pray in Matthew 6:9-13 with what we now call the Lord's Prayer. In 1 Thessalonians 5:17, Paul encourages believers to 'pray without ceasing.' James 5:16 teaches that 'The prayer of a righteous person is powerful and effective.' Jesus also emphasized the importance of private prayer in Matthew 6:6, saying, 'But when you pray, go into your room, close the door and pray to your Father, who is unseen.'";
        } else if (lowerQuestion.includes('suffering') || lowerQuestion.includes('pain')) {
          fallbackResponse = "The Bible addresses suffering in various passages. Romans 8:18 says, 'I consider that our present sufferings are not worth comparing with the glory that will be revealed in us.' James 1:2-4 encourages believers to 'Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.' In 2 Corinthians 12:9, God tells Paul, 'My grace is sufficient for you, for my power is made perfect in weakness.'";
        } else {
          fallbackResponse = "That's an interesting question about the Bible. While I don't have a specific scripture reference for that exact topic, I encourage you to explore passages in both the Old and New Testament that might address this. The Bible contains wisdom on nearly every aspect of human experience. Would you like me to suggest some books of the Bible that might be relevant to your question?";
        }
      }
      
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: fallbackResponse
      }]);
      
      toast.error(language === 'es' ? "No se pudo conectar al asistente bíblico. Usando respuestas predeterminadas." : "Couldn't connect to the Bible assistant. Using fallback responses.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = () => {
    setConversation([]);
  };

  const handleQuickQuestion = (q: string) => {
    setQuestion(q);
    // Auto-submit if on mobile
    if (window.innerWidth < 768) {
      setTimeout(() => {
        handleSubmit(new Event('submit') as any);
      }, 100);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('bible_qa_title')}</h1>
        <p className="text-gray-300">
          {t('bible_qa_subtitle')}
        </p>
      </div>
      
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center">
          <BookOpen size={24} className="text-blue-400 mr-3" />
          <h2 className="text-xl font-semibold">{t('scripture_assistant')}</h2>
          {conversation.length > 0 && (
            <button 
              onClick={handleClearConversation}
              className="ml-auto text-gray-400 hover:text-white transition-colors"
              title={t('clear_conversation')}
            >
              <RefreshCw size={18} />
            </button>
          )}
        </div>
        
        <div className="h-96 overflow-y-auto p-6 space-y-6" id="conversation-container">
          {conversation.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p className="mb-2">{t('ask_bible_faith')}</p>
              <p className="text-sm">{t('examples')} {t('forgiveness_example')} {t('prayer_example')}</p>
            </div>
          ) : (
            conversation.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-gray-800 text-white rounded-tl-none'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-white rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <form onSubmit={handleSubmit} className="flex items-center">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('ask_bible_placeholder')}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-r-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
      
      <div className="mt-8 bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">{t('popular_questions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            t('forgiveness_question_full'),
            t('gods_will_question'),
            t('prayer_question'),
            t('temptation_question'),
            t('love_question'),
            t('faith_question')
          ].map((q, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(q)}
              className="text-left bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BibleQA;