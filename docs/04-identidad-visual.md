# Identidad visual y sistema de diseño web

## 1. Identificación y estado

- **Marca:** RF Consulting.
- **Aplicación principal:** `rfcpty.com`.
- **Mercado:** empresas, pymes y emprendedores en Panamá.
- **Estado:** sistema visual implementado en la aplicación de Factura Electrónica; pendiente de validación corporativa final y activo vectorial maestro.
- **Fuente de la propuesta:** modelo de negocio, alcance, contenido e inventario
  editorial suministrados.

Este documento traduce la estrategia institucional a un lenguaje visual
aplicable. No sustituye un manual corporativo existente. El archivo vectorial
del logotipo, sus colores originales, fotografías autorizadas y cualquier guía
previa deben incorporarse antes de aprobar la identidad definitiva.

### Implementación vigente en Factura Electrónica

- Los tokens de la sección 18 son la fuente semántica de color en `public/rf-brand-theme.css`.
- Inter es la familia principal de la interfaz.
- El logotipo blanco suministrado identifica la navegación oscura; no se fabrica ni separa un isotipo.
- La navegación lateral es retractil en escritorio y conserva iconos y ayudas accesibles al contraerse; en móvil funciona como panel superpuesto.
- La progresión es mobile-first con referencias de 480, 768, 1024, 1280 y 1440 CSS px, contenedores fluidos y ancho máximo.
- Botones, foco, formularios, CRM, ERP y POS comparten radios, colores y áreas táctiles mínimas.
- El tema claro es el valor inicial y el oscuro es opcional y persistente. Ambos tienen reglas explícitas de contraste para textos, listados y estados.
- Diálogos y paneles laterales se pueden cerrar mediante su icono; el panel CRM también mediante el fondo y `Escape`.

## 2. Fundamento de marca

### Propósito

Ayudar a las empresas a tomar control de su tecnología y convertirla en una
capacidad útil, integrada y sostenible para su operación.

### Posicionamiento

RF Consulting es el punto de apoyo tecnológico para empresas que necesitan
comprender, seleccionar, integrar, implementar y evolucionar sus sistemas con
un aliado cercano y técnicamente responsable.

### Promesa

**Tecnología empresarial que funciona con tu operación.**

Esta frase se propone como síntesis de marca, no como eslogan aprobado. Evita
promesas absolutas y conecta tecnología con resultado empresarial.

### Método que debe expresar la identidad

```text
Comprender → Diseñar → Implementar → Evolucionar
```

La marca no debe parecer un vendedor de licencias ni una empresa dedicada a un
solo producto. Debe representar criterio, acompañamiento y capacidad de
ejecución durante todo el ciclo.

## 3. Personalidad

| Atributo | Cómo se expresa | Qué se evita |
| --- | --- | --- |
| Confiable | Información clara, evidencia, procesos visibles y lenguaje preciso | Promesas grandilocuentes o urgencia artificial |
| Cercana | Personas reales, español natural y orientación práctica | Tono frío, distante o excesivamente corporativo |
| Competente | Jerarquía ordenada, detalle técnico cuando aporta valor y casos concretos | Jerga decorativa y listas interminables de marcas |
| Serena | Espacio, contraste, movimiento discreto y decisiones visuales estables | Saturación, animaciones constantes y alarmismo |
| Evolutiva | Sistemas modulares, conexiones y progresión visual | Estética futurista genérica o dependiente de tendencias |
| Íntegra | Límites, precios y condiciones transparentes cuando estén aprobados | Claims no demostrables, certificaciones ambiguas o testimonios inventados |

### Arquetipo operativo

La combinación recomendada es **guía + constructor**:

- La guía comprende el contexto y ayuda a decidir.
- El constructor convierte la decisión en una solución operativa.

No se recomienda el arquetipo de “salvador tecnológico”. El cliente conserva
agencia y RF Consulting aporta criterio, implementación y continuidad.

## 4. Principios visuales

1. **Claridad antes que decoración.** Cada elemento debe explicar, orientar o
   reforzar confianza.
2. **Sistemas conectados.** Líneas, nodos, capas y módulos pueden expresar
   integración, siempre de forma contenida y comprensible.
3. **Personas y contexto reales.** La tecnología aparece dentro de operaciones
   empresariales, no como una colección de símbolos flotantes.
4. **Profundidad con moderación.** Superficies, bordes y sombras comunican
   jerarquía; no simulan una interfaz de ciencia ficción.
5. **Panamá sin folclor visual.** La pertenencia se demuestra mediante casos,
   lenguaje, personas y contexto local; no abusando de banderas o monumentos.
6. **Rendimiento como parte del diseño.** Ninguna decisión visual debe romper los
   presupuestos definidos para la web.

## 5. Sistema de logotipo

### Estado actual

Se suministraron dos archivos PNG transparentes del logotipo: una variante negra
y una variante blanca. La web utiliza la variante negra sobre el encabezado
claro y la blanca sobre el pie de página oscuro. Los archivos se conservan sin
redibujar, recolorear ni modificar sus proporciones.

Todavía se recomienda obtener el archivo vectorial maestro para impresión,
favicon, escalado de alta densidad y futuras aplicaciones de marca.

### Variantes que deben prepararse desde el original

- Principal horizontal a color.
- Compacta o isotipo, solo si ya existe o se diseña y aprueba formalmente.
- Monocromática oscura.
- Monocromática blanca para fondos oscuros.
- Formatos SVG para web y PDF/vector para impresión.
- PNG de respaldo con fondo transparente.

### Zona de seguridad

Usar como mínimo una distancia equivalente a la altura de la letra “R” del
logotipo alrededor de todos sus lados. Si el diseño original define otra unidad,
prevalece la guía oficial.

### Tamaño mínimo provisional

- Versión horizontal digital: 140 px de ancho.
- Símbolo aislado: 32 px, únicamente si conserva legibilidad comprobada.
- Favicon: versión óptica específica; no reducir automáticamente el logo completo.

### Usos prohibidos

- Deformar, inclinar, rotar o cambiar proporciones.
- Aplicar sombras, biseles, degradados o contornos no aprobados.
- Cambiar colores de elementos individuales arbitrariamente.
- Colocarlo sobre fondos con contraste insuficiente o imágenes visualmente ruidosas.
- Añadir nombres de productos como parte permanente del logotipo.
- Usar el logotipo de Factura Electrónica como sustituto del institucional.

## 6. Paleta cromática propuesta

La paleta parte de una base azul profunda asociada a confianza y operación, un
azul vivo para acción digital y un verde azulado que representa integración y
evolución. Los tonos claros evitan una web excesivamente oscura.

### Colores de marca

| Token | Hex | RGB | Uso |
| --- | --- | --- | --- |
| `brand-950` | `#071B33` | 7, 27, 51 | Hero oscuro, footer y fondos de máxima autoridad |
| `brand-900` | `#0B2748` | 11, 39, 72 | Encabezados, navegación y texto de marca |
| `brand-700` | `#124E78` | 18, 78, 120 | Elementos secundarios y gráficos |
| `brand-600` | `#0868AC` | 8, 104, 172 | Enlaces y controles interactivos |
| `brand-500` | `#087CC1` | 8, 124, 193 | Acento institucional sobre fondos adecuados |
| `signal-600` | `#087F78` | 8, 127, 120 | Integración, procesos y estados informativos |
| `signal-500` | `#0A9B8E` | 10, 155, 142 | Acento controlado y visualización |

### Neutros

| Token | Hex | Uso |
| --- | --- | --- |
| `ink-950` | `#101820` | Texto principal |
| `ink-700` | `#344452` | Texto secundario |
| `ink-500` | `#667684` | Metadatos y ayudas, sujeto a contraste |
| `line-300` | `#CBD5DE` | Bordes visibles |
| `surface-100` | `#EDF3F6` | Secciones alternas |
| `surface-50` | `#F7FAFB` | Fondo suave |
| `white` | `#FFFFFF` | Superficie principal |

### Colores semánticos

| Token | Hex | Uso |
| --- | --- | --- |
| `success-700` | `#24703E` | Confirmación y éxito |
| `warning-700` | `#8A5700` | Advertencia que requiere atención |
| `danger-700` | `#A22B35` | Error o acción destructiva |
| `focus-500` | `#F4B942` | Indicador de foco visible |

Los colores semánticos no se usan para decorar líneas de servicio. Su significado
debe permanecer estable en toda la aplicación.

### Proporción recomendada

- 65 % blanco y superficies claras.
- 25 % azul profundo y neutros.
- 10 % acentos azul vivo y verde azulado.

La proporción orienta, no se aplica como fórmula matemática a cada página.

### Reglas de contraste

- Texto normal: relación mínima 4.5:1.
- Texto grande e iconos esenciales: mínimo 3:1.
- Texto blanco solo sobre tonos que superen el contraste requerido.
- `signal-500` no debe utilizarse para texto pequeño sobre blanco sin comprobarlo.
- El color nunca será el único medio para comunicar estado o selección.

La paleta está implementada como línea base del producto y fue ajustada mediante revisión visual de contraste en temas claro y oscuro. Continúa sujeta a comparación con el activo vectorial maestro y a una auditoría WCAG completa antes de producción.

## 7. Tipografía

### Familia principal propuesta

**Inter**, variable y autoalojada en formato WOFF2, para interfaz, titulares y
texto. Es legible en pantallas, dispone de amplio soporte latino y reduce el
número de familias necesarias.

Fallback:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;
```

Si el logotipo utiliza una tipografía identificable, no debe asumirse que esa
fuente es apropiada o está licenciada para texto web.

### Escala tipográfica fluida

| Token | Tamaño orientativo | Uso |
| --- | --- | --- |
| `display` | `clamp(2.5rem, 6vw, 5rem)` | Mensaje principal de portada |
| `h1` | `clamp(2.25rem, 5vw, 4rem)` | Título único de página |
| `h2` | `clamp(1.75rem, 3vw, 2.75rem)` | Secciones principales |
| `h3` | `clamp(1.25rem, 2vw, 1.625rem)` | Subsecciones y tarjetas |
| `body-lg` | `1.125rem` | Entradas y propuestas de valor |
| `body` | `1rem` | Texto general |
| `small` | `0.875rem` | Metadatos y ayudas no esenciales |

### Reglas editoriales

- Longitud de línea: 55–75 caracteres en contenido extenso.
- Cuerpo: interlineado aproximado de 1.6.
- Titulares: interlineado entre 1.05 y 1.2 según tamaño.
- No usar mayúsculas sostenidas en párrafos o botones.
- Limitar pesos a 400, 500, 600 y 700.
- No justificar texto.
- Respetar el tamaño configurado por la persona usuaria.

## 8. Voz y tono

### Voz permanente

- Clara y directa.
- Profesional sin rigidez.
- Pedagógica sin condescendencia.
- Técnica cuando la decisión lo requiere.
- Local y natural para el español de Panamá, sin clichés.
- Honesta sobre límites, tiempos, dependencias y riesgos.

### Tono según contexto

| Contexto | Tono |
| --- | --- |
| Inicio | Seguro, conciso e institucional |
| Especialidades | Consultivo, orientado al problema y al resultado |
| Soporte | Sereno, práctico y transparente |
| Artículo educativo | Explicativo, verificable y sin presión comercial excesiva |
| Error o interrupción | Humano, específico y accionable |
| Facturación Electrónica | Preciso y prudente; toda afirmación normativa requiere fuente y fecha |

### Mensajes recomendados

- “Conversemos sobre tu operación.”
- “Solicitar un diagnóstico.”
- “Explorar sistemas empresariales.”
- “Ver opciones de soporte.”
- “Conocer la solución de Facturación Electrónica.”

### Mensajes que deben evitarse

- “La solución definitiva.”
- “Garantizamos cero errores.”
- “Evita multas ahora” sin contexto normativo verificable.
- “Somos líderes” sin evidencia.
- Urgencias artificiales, exceso de signos de exclamación o lenguaje de miedo.

## 9. Dirección fotográfica

### Contenido preferido

- Equipo y cofundadores reales en espacios de trabajo auténticos.
- Interacción con clientes con autorización documentada.
- Detalles de implementación: diagnóstico, configuración, capacitación y soporte.
- Empresas y profesionales panameños diversos, sin posar de manera artificial.
- Capturas de sistemas reales, anonimizadas y presentadas dentro de un contexto útil.

### Tratamiento

- Luz natural o suave, color neutro con azules discretos.
- Composición limpia y suficiente espacio negativo para texto cuando se planifique.
- Perspectiva humana: colaboración, conversación y resolución.
- Recorte coherente y punto focal protegido en responsive.
- Formatos AVIF/WebP con alternativa cuando sea necesario.

### Evitar

- Personas genéricas señalando una pantalla vacía.
- Laptop con iconos de Wi‑Fi, PDF, XLS, nubes o engranajes flotantes.
- Robots, cerebros digitales y manos holográficas como representación de IA.
- Exceso de azul neón, código ilegible o centros de datos irrelevantes.
- Imágenes de stock presentadas como si fueran clientes o empleados.
- Texto esencial incrustado dentro de imágenes.

Cada medio debe incluir procedencia, licencia, permiso, texto alternativo y una
decisión explícita sobre si es informativo o decorativo.

## 10. Ilustración, iconografía y gráficos

### Lenguaje gráfico

El concepto visual central es **conectar la operación**. Puede representarse con:

- nodos unidos por trayectorias simples;
- módulos que convergen en un sistema;
- capas ordenadas de información;
- secuencias que muestran el método de trabajo;
- diagramas de antes/después cuando exista evidencia.

### Iconos

- Estilo lineal, esquinas moderadamente redondeadas y grosor consistente.
- Tamaños base de 20, 24 y 32 px.
- Iconos acompañados de texto cuando su significado no sea universal.
- Preferir una biblioteca pequeña y versionada; no mezclar familias.
- SVG accesible, optimizado y sin dependencias externas en runtime.

### Ilustraciones

- Geometría modular y editorial, no caricatura infantil.
- Máximo dos colores de marca más neutros por composición.
- Utilizarse para explicar relaciones o procesos, no para rellenar espacios.

### Visualización de datos

- Presentar fuente, período y unidad.
- Emplear patrones, etiquetas o formas además del color.
- No crear estadísticas decorativas ni cifras de experiencia no verificadas.

## 11. Forma, espacio y composición

### Sistema espacial

Base de 4 px con pasos recomendados:

`4, 8, 12, 16, 24, 32, 48, 64, 80, 96, 128`.

- Contenedor de lectura: hasta 720 px.
- Contenedor general: hasta 1200 px.
- Gutter móvil: 20 px; escritorio: 32 px, sujeto al viewport.
- Secciones: 64–96 px en móvil y 96–144 px en escritorio cuando el contenido lo permita.

### Bordes y radios

- Radio pequeño: 8 px para campos y controles compactos.
- Radio medio: 16 px para tarjetas y superficies.
- Radio grande: 24 px para bloques destacados.
- Píldoras solo para etiquetas, estados o filtros; no para todo botón y tarjeta.
- Bordes de 1 px con contraste perceptible.

### Sombras

- Usar sombra solo cuando indique elevación o interacción.
- Preferir bordes y contraste de superficie en contenido editorial.
- Evitar “glassmorphism”, desenfoques costosos y tarjetas flotando sin jerarquía.

## 12. Sistema de componentes web

### Navegación principal

- Logotipo a la izquierda, navegación central o derecha y CTA principal.
- Máximo recomendado de seis entradas visibles antes de agrupar.
- Estado actual visible sin depender solo del color.
- Menú móvil con botón rotulado, foco gestionado y cierre mediante `Escape`.
- Header fijo únicamente si no roba espacio crítico y supera pruebas de uso móvil.

### Botones

| Variante | Uso |
| --- | --- |
| Primario | Una acción principal por bloque: diagnóstico o contacto |
| Secundario | Exploración de servicio o contenido relacionado |
| Texto | Navegación contextual de baja prominencia |
| Destructivo | Solo administración; nunca como color de marca |

- Altura táctil mínima de 44 px.
- Estados hover, active, focus, disabled y loading.
- Etiquetas con verbo y resultado; evitar “Haz clic aquí”.
- No colocar dos botones primarios compitiendo en el mismo bloque.

### Tarjetas de especialidad

Cada tarjeta debe contener:

1. nombre de la especialidad;
2. problema que resuelve en una frase;
3. máximo tres capacidades o resultados;
4. enlace descriptivo;
5. icono opcional con valor semántico.

La tarjeta completa puede ser interactiva si conserva semántica, foco y selección
de texto. No esconder información esencial detrás de hover.

### Formularios

- Etiquetas persistentes encima del campo.
- Ayuda y formato esperado antes del error.
- Error junto al campo y resumen superior cuando sea necesario.
- No usar placeholder como etiqueta.
- Indicar campos opcionales; reducir campos obligatorios al mínimo comercial.
- Confirmación clara, alternativa de contacto y privacidad cerca del envío.

### Testimonios y casos

- Solo publicar material autorizado y atribuible.
- Priorizar situación → intervención → resultado verificable.
- No usar carruseles automáticos.
- Si no existen resultados cuantificables, describir el contexto sin inventarlos.

### Blog

- Índice orientado a temas y problemas, no a una cuadrícula infinita de tarjetas.
- Artículo con autor/revisor, fecha de publicación y actualización.
- Tabla de contenido solo en piezas extensas.
- CTA relacionado después de aportar valor, no interrumpiendo cada sección.
- Anchura de lectura controlada y estilos completos para tablas, código y citas breves.

### Estados del sistema

- Skeleton solo si existe carga perceptible; SSR debería reducir su necesidad.
- Vacío: explicar qué falta y qué puede hacerse.
- Error: indicar qué ocurrió en lenguaje útil, qué se conservó y cómo continuar.
- Éxito: confirmar la acción y expectativa de seguimiento sin prometer un SLA no aprobado.

## 13. Arquitectura visual de la portada

```text
Header claro y directo
│
├── Hero: propuesta institucional + CTA + evidencia visual auténtica
├── Misión: por qué existe RF Consulting
├── Especialidades: cuatro capacidades centrales
├── Sistemas empresariales: servicio de alta intención
├── Integraciones y automatización: conectar la operación
├── Facturación Electrónica: bloque diferenciado hacia la vertical
├── Servicios web: infraestructura de presencia digital
├── Método: Comprender → Diseñar → Implementar → Evolucionar
├── Evidencia: casos, tecnologías o experiencia únicamente verificables
├── Conocimiento: artículos recientes seleccionados
├── Contacto: siguiente paso simple
└── Footer institucional y legal
```

### Hero propuesto

- **Eyebrow:** Consultoría y soluciones tecnológicas para empresas.
- **Título:** Tecnología empresarial que funciona con tu operación.
- **Texto:** RF Consulting ayuda a seleccionar, integrar, implementar y mantener
  sistemas que acompañan el crecimiento de tu empresa.
- **CTA principal:** Solicitar un diagnóstico.
- **CTA secundario:** Explorar especialidades.

El hero no debe comenzar con amenazas de multas ni convertir Facturación
Electrónica en la identidad completa de RF Consulting.

## 14. Aplicación por sección

| Sección | Dirección visual | Evidencia o CTA |
| --- | --- | --- |
| Nosotros | Fotografía real, cronología breve y método | Conocer cómo trabajamos |
| Sistemas empresariales | Flujos de operación y capturas autorizadas | Solicitar diagnóstico |
| Integraciones | Diagramas claros entre sistemas | Evaluar una integración |
| Desarrollo | Problema, proceso y resultados; evitar pantallas de código decorativas | Conversar sobre un proyecto |
| Soporte | Claridad de modalidades, horarios y condiciones | Solicitar soporte |
| Servicios web | Arquitectura simple de dominio, correo, hosting y sitio | Pedir cotización |
| Facturación Electrónica | Bloque relacionado pero visualmente delimitado | Ir a la vertical especializada |
| Blog | Lectura editorial, fuentes y fecha de actualización | Explorar servicio relacionado |
| Contacto | Formulario breve y canales alternativos | Enviar solicitud |

## 15. Relación visual con FacturaElectronica.clic

La vertical puede compartir fundamentos —tipografía, rigor, espaciado y una
parte del azul institucional—, pero debe tener un acento y una jerarquía propios.

### Regla de familia de marca

- RF Consulting aparece como marca institucional y respaldo.
- Factura Electrónica aparece como solución especializada.
- No fusionar ambos logotipos ni crear un lockup improvisado.
- Usar mensajes consistentes: “Una solución especializada de RF Consulting” o
  “Implementado por RF Consulting”, únicamente si negocio los aprueba.
- Los enlaces cruzados deben parecer navegación entre propiedades relacionadas,
  no publicidad de terceros.

El color específico de la vertical se definirá al auditar su identidad actual;
no debe asignarse arbitrariamente desde este documento.

## 16. Movimiento e interacción

- Duraciones habituales entre 120 y 240 ms.
- Movimiento para explicar estado, foco o continuidad; no como entretenimiento.
- Respetar `prefers-reduced-motion`.
- No animar texto de lectura, fondos continuamente ni métricas contando desde cero.
- Evitar scroll hijacking, paralaje y transiciones que bloqueen interacción.
- Los controles deben responder de inmediato y conservar estabilidad visual.

## 17. Accesibilidad visual

- Cumplimiento objetivo WCAG 2.2 AA.
- Zoom al 200 % sin pérdida de contenido o función.
- Reflujo funcional desde 320 CSS px.
- Orden visual consistente con el orden del DOM.
- Foco de alto contraste y nunca oculto tras elementos fijos.
- Áreas táctiles de al menos 44 × 44 CSS px cuando sea aplicable.
- Texto alternativo según intención; imágenes decorativas con `alt=""`.
- Subtítulos y transcripción para contenido audiovisual esencial.
- Iconos, gráficas y estados comprensibles sin percepción del color.

## 18. Tokens iniciales de implementación

Los tokens son el contrato entre identidad y código. Los nombres son semánticos
y permiten ajustar la paleta después de auditar el logotipo.

```css
:root {
  --color-brand-950: #071b33;
  --color-brand-900: #0b2748;
  --color-brand-700: #124e78;
  --color-brand-600: #0868ac;
  --color-brand-500: #087cc1;
  --color-signal-600: #087f78;
  --color-signal-500: #0a9b8e;

  --color-text: #101820;
  --color-text-muted: #344452;
  --color-border: #cbd5de;
  --color-surface: #ffffff;
  --color-surface-subtle: #f7fafb;
  --color-surface-accent: #edf3f6;
  --color-focus: #f4b942;

  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --radius-sm: 0.5rem;
  --radius-md: 1rem;
  --radius-lg: 1.5rem;
  --content-reading: 45rem;
  --content-wide: 75rem;
}
```

Estos tokens no autorizan la implementación final hasta pasar contraste y
comparación con el logo original.

## 19. Gobernanza de la identidad

### Fuente de verdad

Una vez aprobados, los siguientes elementos deben versionarse en el repositorio:

- logotipos maestros y reglas de uso;
- tokens de color, tipografía, espacio y movimiento;
- componentes y estados documentados;
- licencias de fuentes, iconos y fotografías;
- plantillas de página y ejemplos aprobados;
- historial de decisiones visuales relevantes.

### Cambios que requieren revisión

- Modificar logotipo, paleta principal o tipografía.
- Introducir una nueva familia de iconos.
- Crear una submarca o representación conjunta.
- Publicar claims, certificaciones, testimonios o cifras.
- Añadir un patrón que afecte accesibilidad o presupuesto de rendimiento.

Las decisiones de alto impacto deben registrarse mediante ADR de diseño o del
sistema, incluyendo contexto, alternativas, consecuencias y evidencia.

## 20. Puerta de calidad visual

La identidad está lista para pasar a diseño de alta fidelidad cuando:

- el responsable de negocio aprueba propósito, posicionamiento, personalidad y tono;
- se obtiene y audita el logotipo vectorial original;
- la paleta propuesta es compatible con el logo y supera contraste;
- existen permisos y procedencia para fotografías y marcas de terceros;
- se aprueban al menos las plantillas de Inicio, Especialidad, Artículo y Contacto;
- todos los componentes críticos incluyen estados responsive, teclado, error y foco;
- una prueba con usuarios representativos confirma comprensión de la oferta y del CTA;
- la implementación piloto cumple los presupuestos de accesibilidad y rendimiento.

## 21. Entregables visuales posteriores

1. Auditoría del logotipo y activos actuales.
2. Moodboard con referencias y anti-referencias.
3. Dos direcciones visuales comparables aplicadas al mismo contenido.
4. Wireframes mobile-first de recorridos críticos.
5. Diseño de alta fidelidad para cuatro plantillas representativas.
6. Biblioteca de componentes y tokens implementados.
7. Paquete optimizado de logotipos, iconos, fotografías y Open Graph.
8. Checklist de revisión visual, responsive y accesible.

## 22. Preguntas abiertas

- ¿Cuál es el archivo maestro y la paleta vigente del logotipo?
- ¿Existe un eslogan aprobado o debe validarse la propuesta de este documento?
- ¿Qué fotografías institucionales tienen autorización de publicación?
- ¿Qué clientes, aliados, productos y certificaciones pueden mostrarse?
- ¿Debe la identidad sentirse más consultiva, más técnica o equilibrar ambas por igual?
- ¿Existe una identidad aprobada para `facturaelectronica.clic`?
- ¿Qué responsables aprueban marca, contenido y accesibilidad antes de producción?
