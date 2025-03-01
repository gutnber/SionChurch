import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'es';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// Translation dictionary
const translations: Record<string, Record<Language, string>> = {
  // Common
  'language': {
    en: 'Language',
    es: 'Idioma'
  },
  'english': {
    en: 'English',
    es: 'Inglés'
  },
  'spanish': {
    en: 'Spanish',
    es: 'Español'
  },
  
  // Navigation
  'home': {
    en: 'Home',
    es: 'Inicio'
  },
  'activities': {
    en: 'Activities',
    es: 'Actividades'
  },
  'events': {
    en: 'Events',
    es: 'Eventos'
  },
  'calendar': {
    en: 'Calendar',
    es: 'Calendario'
  },
  'news': {
    en: 'News',
    es: 'Noticias'
  },
  'gallery': {
    en: 'Gallery',
    es: 'Galería'
  },
  'bible_qa': {
    en: 'Bible Q&A',
    es: 'Preguntas Bíblicas'
  },
  'contact': {
    en: 'Contact',
    es: 'Contacto'
  },
  'sign_in': {
    en: 'Sign In',
    es: 'Iniciar Sesión'
  },
  'sign_up': {
    en: 'Sign Up',
    es: 'Registrarse'
  },
  'sign_out': {
    en: 'Sign Out',
    es: 'Cerrar Sesión'
  },
  'profile': {
    en: 'Profile',
    es: 'Perfil'
  },
  'admin_dashboard': {
    en: 'Admin Dashboard',
    es: 'Panel de Administración'
  },
  
  // Home Page
  'welcome_church': {
    en: 'Welcome to Grace Church',
    es: 'Bienvenido a Iglesia Gracia'
  },
  'church_subtitle': {
    en: 'A place of worship, community, and spiritual growth for all',
    es: 'Un lugar de adoración, comunidad y crecimiento espiritual para todos'
  },
  'upcoming_events': {
    en: 'Upcoming Events',
    es: 'Próximos Eventos'
  },
  'view_all': {
    en: 'View All',
    es: 'Ver Todo'
  },
  'learn_more': {
    en: 'Learn More',
    es: 'Más Información'
  },
  'join_us_worship': {
    en: 'Join Us for Worship',
    es: 'Únete a Nosotros para Adorar'
  },
  'weekly_services': {
    en: 'Weekly services and gatherings',
    es: 'Servicios y reuniones semanales'
  },
  'bible_questions': {
    en: 'Have Questions About the Bible?',
    es: '¿Tienes Preguntas Sobre la Biblia?'
  },
  'bible_qa_description': {
    en: 'Our Bible Q&A section uses advanced AI to help answer your questions about scripture, faith, and spiritual growth.',
    es: 'Nuestra sección de Preguntas Bíblicas utiliza IA avanzada para ayudar a responder tus preguntas sobre las escrituras, la fe y el crecimiento espiritual.'
  },
  'ask_question': {
    en: 'Ask a Question',
    es: 'Hacer una Pregunta'
  },
  'sample_question': {
    en: 'Sample Question',
    es: 'Pregunta de Ejemplo'
  },
  'forgiveness_question': {
    en: '"What does the Bible say about forgiveness?"',
    es: '"¿Qué dice la Biblia sobre el perdón?"'
  },
  'join_community': {
    en: 'Join Our Community',
    es: 'Únete a Nuestra Comunidad'
  },
  'community_description': {
    en: 'Whether you\'re seeking spiritual growth, community, or answers to life\'s big questions, we welcome you to become part of our church family.',
    es: 'Ya sea que busques crecimiento espiritual, comunidad o respuestas a las grandes preguntas de la vida, te invitamos a formar parte de nuestra familia de la iglesia.'
  },
  'sign_up_today': {
    en: 'Sign Up Today',
    es: 'Regístrate Hoy'
  },
  
  // Events Page
  'church_events': {
    en: 'Church Events',
    es: 'Eventos de la Iglesia'
  },
  'events_description': {
    en: 'Join us for upcoming events and gatherings. Connect with our community and grow in faith together.',
    es: 'Únete a nuestros próximos eventos y reuniones. Conéctate con nuestra comunidad y crece en la fe juntos.'
  },
  'manage_events': {
    en: 'Manage Events',
    es: 'Administrar Eventos'
  },
  'upcoming_events_tab': {
    en: 'Upcoming Events',
    es: 'Próximos Eventos'
  },
  'past_events_tab': {
    en: 'Past Events',
    es: 'Eventos Pasados'
  },
  'event_details': {
    en: 'Event Details',
    es: 'Detalles del Evento'
  },
  'share': {
    en: 'Share',
    es: 'Compartir'
  },
  'add_to_calendar': {
    en: 'Add to Calendar',
    es: 'Añadir al Calendario'
  },
  
  // Activities Page
  'weekly_activities': {
    en: 'Weekly Activities',
    es: 'Actividades Semanales'
  },
  'activities_description': {
    en: 'Join us throughout the week for worship, study, fellowship, and service opportunities.',
    es: 'Únete a nosotros durante la semana para adoración, estudio, compañerismo y oportunidades de servicio.'
  },
  'manage_activities': {
    en: 'Manage Activities',
    es: 'Administrar Actividades'
  },
  'all': {
    en: 'All',
    es: 'Todo'
  },
  'men': {
    en: 'Men',
    es: 'Hombres'
  },
  'women': {
    en: 'Women',
    es: 'Mujeres'
  },
  'youth': {
    en: 'Youth',
    es: 'Jóvenes'
  },
  'marriage': {
    en: 'Marriage',
    es: 'Matrimonio'
  },
  'prayer': {
    en: 'Prayer',
    es: 'Oración'
  },
  'bible_study': {
    en: 'Bible Study',
    es: 'Estudio Bíblico'
  },
  'get_involved': {
    en: 'Want to Get Involved?',
    es: '¿Quieres Participar?'
  },
  'get_involved_description': {
    en: 'We have many opportunities to serve and participate in our church community. Contact us to learn more about how you can get involved.',
    es: 'Tenemos muchas oportunidades para servir y participar en nuestra comunidad de la iglesia. Contáctanos para saber más sobre cómo puedes participar.'
  },
  'contact_us': {
    en: 'Contact Us',
    es: 'Contáctanos'
  },
  
  // Calendar Page
  'church_calendar': {
    en: 'Church Calendar',
    es: 'Calendario de la Iglesia'
  },
  'calendar_description': {
    en: 'View all our events and activities in one place. Plan your involvement and stay connected with our church community.',
    es: 'Ve todos nuestros eventos y actividades en un solo lugar. Planifica tu participación y mantente conectado con nuestra comunidad de la iglesia.'
  },
  'month': {
    en: 'Month',
    es: 'Mes'
  },
  'week': {
    en: 'Week',
    es: 'Semana'
  },
  'day': {
    en: 'Day',
    es: 'Día'
  },
  'all_items': {
    en: 'All Items',
    es: 'Todos los Elementos'
  },
  'events_only': {
    en: 'Events Only',
    es: 'Solo Eventos'
  },
  'activities_only': {
    en: 'Activities Only',
    es: 'Solo Actividades'
  },
  'all_categories': {
    en: 'All Categories',
    es: 'Todas las Categorías'
  },
  'export': {
    en: 'Export',
    es: 'Exportar'
  },
  'add_event': {
    en: 'Add Event',
    es: 'Añadir Evento'
  },
  'need_more_info': {
    en: 'Need More Information?',
    es: '¿Necesitas Más Información?'
  },
  'calendar_help': {
    en: 'If you have questions about our events or activities, or need assistance with the calendar, please don\'t hesitate to reach out.',
    es: 'Si tienes preguntas sobre nuestros eventos o actividades, o necesitas ayuda con el calendario, no dudes en contactarnos.'
  },
  
  // Gallery Page
  'photo_gallery': {
    en: 'Photo Gallery',
    es: 'Galería de Fotos'
  },
  'gallery_description': {
    en: 'Browse through our collection of photos from church events, activities, and gatherings.',
    es: 'Explora nuestra colección de fotos de eventos, actividades y reuniones de la iglesia.'
  },
  'create_album': {
    en: 'Create Album',
    es: 'Crear Álbum'
  },
  'upload_photo': {
    en: 'Upload Photo',
    es: 'Subir Foto'
  },
  'search_albums': {
    en: 'Search albums...',
    es: 'Buscar álbumes...'
  },
  'photos': {
    en: 'photos',
    es: 'fotos'
  },
  'no_albums_found': {
    en: 'No Albums Found',
    es: 'No Se Encontraron Álbumes'
  },
  'no_albums_search': {
    en: 'No albums match your search criteria.',
    es: 'Ningún álbum coincide con tu búsqueda.'
  },
  'no_albums_yet': {
    en: 'There are no photo albums yet.',
    es: 'Aún no hay álbumes de fotos.'
  },
  'create_first_album': {
    en: 'Create First Album',
    es: 'Crear Primer Álbum'
  },
  
  // Bible Q&A Page
  'bible_qa_title': {
    en: 'Bible Q&A',
    es: 'Preguntas Bíblicas'
  },
  'bible_qa_subtitle': {
    en: 'Ask questions about the Bible, faith, and spiritual growth',
    es: 'Haz preguntas sobre la Biblia, la fe y el crecimiento espiritual'
  },
  'scripture_assistant': {
    en: 'Scripture Assistant',
    es: 'Asistente de Escrituras'
  },
  'ask_bible_faith': {
    en: 'Ask a question about the Bible or faith',
    es: 'Haz una pregunta sobre la Biblia o la fe'
  },
  'examples': {
    en: 'Examples:',
    es: 'Ejemplos:'
  },
  'forgiveness_example': {
    en: '"What does the Bible say about forgiveness?"',
    es: '"¿Qué dice la Biblia sobre el perdón?"'
  },
  'prayer_example': {
    en: '"How can I pray effectively?"',
    es: '"¿Cómo puedo orar eficazmente?"'
  },
  'ask_bible_placeholder': {
    en: 'Ask a question about the Bible...',
    es: 'Haz una pregunta sobre la Biblia...'
  },
  'popular_questions': {
    en: 'Popular Questions',
    es: 'Preguntas Populares'
  },
  'forgiveness_question_full': {
    en: 'What does the Bible say about forgiveness?',
    es: '¿Qué dice la Biblia sobre el perdón?'
  },
  'gods_will_question': {
    en: 'How can I know God\'s will for my life?',
    es: '¿Cómo puedo conocer la voluntad de Dios para mi vida?'
  },
  'prayer_question': {
    en: 'What does the Bible teach about prayer?',
    es: '¿Qué enseña la Biblia sobre la oración?'
  },
  'temptation_question': {
    en: 'How can I overcome temptation?',
    es: '¿Cómo puedo vencer la tentación?'
  },
  'love_question': {
    en: 'What does the Bible say about love?',
    es: '¿Qué dice la Biblia sobre el amor?'
  },
  'faith_question': {
    en: 'How can I grow stronger in my faith?',
    es: '¿Cómo puedo fortalecer mi fe?'
  },
  'clear_conversation': {
    en: 'Clear conversation',
    es: 'Borrar conversación'
  },
  
  // Contact Page
  'contact_us_title': {
    en: 'Contact Us',
    es: 'Contáctanos'
  },
  'contact_description': {
    en: 'We\'d love to hear from you. Reach out with any questions, prayer requests, or to learn more about our church.',
    es: 'Nos encantaría saber de ti. Comunícate con cualquier pregunta, petición de oración o para saber más sobre nuestra iglesia.'
  },
  'send_message': {
    en: 'Send Us a Message',
    es: 'Envíanos un Mensaje'
  },
  'your_name': {
    en: 'Your Name',
    es: 'Tu Nombre'
  },
  'email_address': {
    en: 'Email Address',
    es: 'Correo Electrónico'
  },
  'phone_number': {
    en: 'Phone Number',
    es: 'Número de Teléfono'
  },
  'subject': {
    en: 'Subject',
    es: 'Asunto'
  },
  'select_subject': {
    en: 'Select a subject',
    es: 'Selecciona un asunto'
  },
  'general_inquiry': {
    en: 'General Inquiry',
    es: 'Consulta General'
  },
  'prayer_request': {
    en: 'Prayer Request',
    es: 'Petición de Oración'
  },
  'volunteering': {
    en: 'Volunteering',
    es: 'Voluntariado'
  },
  'membership': {
    en: 'Membership',
    es: 'Membresía'
  },
  'other': {
    en: 'Other',
    es: 'Otro'
  },
  'your_message': {
    en: 'Your Message',
    es: 'Tu Mensaje'
  },
  'send_message_button': {
    en: 'Send Message',
    es: 'Enviar Mensaje'
  },
  'sending_message': {
    en: 'Sending Message...',
    es: 'Enviando Mensaje...'
  },
  'contact_information': {
    en: 'Contact Information',
    es: 'Información de Contacto'
  },
  'our_location': {
    en: 'Our Location',
    es: 'Nuestra Ubicación'
  },
  'phone': {
    en: 'Phone',
    es: 'Teléfono'
  },
  'email': {
    en: 'Email',
    es: 'Correo Electrónico'
  },
  'sunday_service': {
    en: 'Sunday Service',
    es: 'Servicio Dominical'
  },
  'find_us': {
    en: 'Find Us',
    es: 'Encuéntranos'
  },
  
  // Auth Pages
  'welcome_back': {
    en: 'Welcome Back',
    es: 'Bienvenido de Nuevo'
  },
  'create_account': {
    en: 'Create an Account',
    es: 'Crear una Cuenta'
  },
  'password': {
    en: 'Password',
    es: 'Contraseña'
  },
  'confirm_password': {
    en: 'Confirm Password',
    es: 'Confirmar Contraseña'
  },
  'signing_in': {
    en: 'Signing In...',
    es: 'Iniciando Sesión...'
  },
  'creating_account': {
    en: 'Creating Account...',
    es: 'Creando Cuenta...'
  },
  'have_account': {
    en: 'Already have an account?',
    es: '¿Ya tienes una cuenta?'
  },
  'no_account': {
    en: 'Don\'t have an account?',
    es: '¿No tienes una cuenta?'
  },
  'create_admin_account': {
    en: 'Create Admin Account',
    es: 'Crear Cuenta de Administrador'
  },
  
  // Admin Dashboard
  'admin_panel': {
    en: 'Admin Panel',
    es: 'Panel de Administración'
  },
  'overview': {
    en: 'Overview',
    es: 'Resumen'
  },
  'home_page': {
    en: 'Home Page',
    es: 'Página de Inicio'
  },
  'users': {
    en: 'Users',
    es: 'Usuarios'
  },
  'settings': {
    en: 'Settings',
    es: 'Configuración'
  },
  'back_to_website': {
    en: 'Back to Website',
    es: 'Volver al Sitio Web'
  },
  
  // Footer
  'quick_links': {
    en: 'Quick Links',
    es: 'Enlaces Rápidos'
  },
  'weekly_activities_footer': {
    en: 'Weekly Activities',
    es: 'Actividades Semanales'
  },
  'view_all_activities': {
    en: 'View all activities',
    es: 'Ver todas las actividades'
  },
  'copyright': {
    en: 'All rights reserved.',
    es: 'Todos los derechos reservados.'
  },
  
  // Misc
  'loading': {
    en: 'Loading...',
    es: 'Cargando...'
  },
  'error': {
    en: 'Error',
    es: 'Error'
  },
  'success': {
    en: 'Success',
    es: 'Éxito'
  },
  'cancel': {
    en: 'Cancel',
    es: 'Cancelar'
  },
  'save': {
    en: 'Save',
    es: 'Guardar'
  },
  'edit': {
    en: 'Edit',
    es: 'Editar'
  },
  'delete': {
    en: 'Delete',
    es: 'Eliminar'
  },
  'search': {
    en: 'Search',
    es: 'Buscar'
  },
  'filter': {
    en: 'Filter',
    es: 'Filtrar'
  },
  'back': {
    en: 'Back',
    es: 'Atrás'
  },
  'next': {
    en: 'Next',
    es: 'Siguiente'
  },
  'previous': {
    en: 'Previous',
    es: 'Anterior'
  }
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (language: Language) => set({ language }),
      t: (key: string) => {
        const { language } = get();
        return translations[key]?.[language] || key;
      }
    }),
    {
      name: 'language-store',
    }
  )
);