// Catálogo de ejercicios.
// Las fotos vienen de free-exercise-db (https://github.com/yuhonas/free-exercise-db), dominio público (Unlicense).
// Cada ejercicio pertenece a un "patrón": todos los ejercicios del mismo patrón son sustitutos entre sí.
// El orden dentro de cada patrón es el de preferencia para alguien que empieza (máquinas primero: más fáciles de aprender y seguras).

export const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export const PATTERNS = {
  squat:    { name: 'Sentadilla / Prensa', muscles: { cuadriceps: 1, gluteo: 0.5 } },
  hinge:    { name: 'Bisagra de cadera (peso muerto)', muscles: { femoral: 1, gluteo: 1, lumbar: 0.5 } },
  glute:    { name: 'Glúteo', muscles: { gluteo: 1, femoral: 0.3 } },
  legcurl:  { name: 'Curl femoral', muscles: { femoral: 1 } },
  legext:   { name: 'Extensión de cuádriceps', muscles: { cuadriceps: 1 } },
  lunge:    { name: 'Zancadas / Unilateral', muscles: { cuadriceps: 1, gluteo: 0.7 } },
  hpush:    { name: 'Empuje horizontal (pecho)', muscles: { pecho: 1, triceps: 0.5, hombro: 0.3 } },
  ipush:    { name: 'Empuje inclinado (pecho alto)', muscles: { pecho: 1, hombro: 0.5, triceps: 0.5 } },
  vpush:    { name: 'Press de hombro', muscles: { hombro: 1, triceps: 0.5 } },
  vpull:    { name: 'Tirón vertical (jalón)', muscles: { espalda: 1, biceps: 0.5 } },
  hpull:    { name: 'Remo', muscles: { espalda: 1, biceps: 0.5, hombro: 0.3 } },
  lateral:  { name: 'Elevaciones laterales', muscles: { hombro: 1 } },
  reardelt: { name: 'Deltoides posterior', muscles: { hombro: 1, espalda: 0.3 } },
  fly:      { name: 'Aperturas de pecho', muscles: { pecho: 1 } },
  biceps:   { name: 'Bíceps', muscles: { biceps: 1 } },
  triceps:  { name: 'Tríceps', muscles: { triceps: 1 } },
  calves:   { name: 'Gemelos', muscles: { gemelo: 1 } },
  core:     { name: 'Abdomen / Core', muscles: { core: 1 } },
};

export const MUSCLE_NAMES = {
  cuadriceps: 'Cuádriceps', femoral: 'Femoral', gluteo: 'Glúteo', lumbar: 'Lumbar',
  pecho: 'Pecho', espalda: 'Espalda', hombro: 'Hombro', biceps: 'Bíceps',
  triceps: 'Tríceps', gemelo: 'Gemelo', core: 'Core',
};

// eq: maquina | polea | mancuernas | barra | smith | corporal
// inc: incremento de peso habitual (kg). En mancuernas es por mancuerna.
// mode: 'weight' (peso x reps), 'reps' (solo repeticiones), 'time' (segundos)
const E = (id, name, pattern, eq, inc, tip, extra = {}) => ({ id, name, pattern, eq, inc, tip, mode: 'weight', ...extra });

export const EXERCISES = [
  // --- Sentadilla / prensa
  E('Leg_Press', 'Prensa de piernas', 'squat', 'maquina', 5, 'Pies a la anchura de hombros en la plataforma. Baja hasta que las rodillas formen ~90° sin despegar la zona lumbar del respaldo. No bloquees las rodillas arriba.'),
  E('Smith_Machine_Squat', 'Sentadilla en máquina Smith', 'squat', 'smith', 5, 'La barra guiada por raíles. Pies un poco adelantados, baja controlado hasta muslos paralelos al suelo.'),
  E('Hack_Squat', 'Sentadilla Hack (máquina)', 'squat', 'maquina', 5, 'Espalda apoyada en el respaldo inclinado, hombros bajo las almohadillas. Baja profundo y empuja con todo el pie.'),
  E('Goblet_Squat', 'Sentadilla Goblet (mancuerna o kettlebell)', 'squat', 'mancuernas', 2, 'Sujeta una mancuerna pegada al pecho. Codos entre las rodillas al bajar, pecho alto.'),
  E('Barbell_Squat', 'Sentadilla con barra', 'squat', 'barra', 5, 'Barra sobre trapecios, abdomen apretado, baja hasta romper el paralelo con la espalda neutra. Técnica exigente: empieza ligero.'),

  // --- Bisagra
  E('Romanian_Deadlift', 'Peso muerto rumano con barra', 'hinge', 'barra', 5, 'Rodillas ligeramente flexionadas, lleva la cadera atrás deslizando la barra por los muslos hasta notar estiramiento en el femoral. Espalda recta siempre.'),
  E('Stiff-Legged_Dumbbell_Deadlift', 'Peso muerto rumano con mancuernas', 'hinge', 'mancuernas', 2, 'Igual que el rumano con barra pero con mancuernas pegadas a las piernas. Cadera atrás, espalda neutra.'),
  E('Smith_Machine_Stiff-Legged_Deadlift', 'Peso muerto rumano en Smith', 'hinge', 'smith', 5, 'Barra guiada. Cadera atrás hasta notar el femoral, sube apretando glúteo.'),
  E('Hyperextensions_Back_Extensions', 'Hiperextensiones (banco romano)', 'hinge', 'corporal', 2.5, 'Cadera apoyada en el borde del banco. Baja con la espalda neutra y sube apretando glúteos. Puedes sujetar un disco para añadir peso.', { mode: 'reps' }),

  // --- Glúteo
  E('Barbell_Hip_Thrust', 'Hip thrust con barra', 'glute', 'barra', 5, 'Espalda alta apoyada en un banco, barra en la cadera (usa almohadilla). Empuja hasta alinear tronco y muslos y aprieta el glúteo 1 segundo.'),
  E('Barbell_Glute_Bridge', 'Puente de glúteo con barra', 'glute', 'barra', 5, 'Como el hip thrust pero tumbado en el suelo. Recorrido más corto, más fácil de montar.'),
  E('One-Legged_Cable_Kickback', 'Patada de glúteo en polea', 'glute', 'polea', 2.5, 'Tobillera en la polea baja. Lleva la pierna atrás sin arquear la espalda.'),
  E('Single_Leg_Glute_Bridge', 'Puente de glúteo a una pierna', 'glute', 'corporal', 0, 'Tumbado, una pierna estirada, empuja con el talón de la otra.', { mode: 'reps' }),

  // --- Curl femoral
  E('Lying_Leg_Curls', 'Curl femoral tumbado (máquina)', 'legcurl', 'maquina', 2.5, 'Tumbado boca abajo, almohadilla sobre los talones. Flexiona sin levantar la cadera del banco y baja lento.'),
  E('Seated_Leg_Curl', 'Curl femoral sentado (máquina)', 'legcurl', 'maquina', 2.5, 'Sentado, rodillas alineadas con el eje de la máquina. Lleva los talones hacia abajo y atrás; baja lento.'),
  E('Standing_Leg_Curl', 'Curl femoral de pie (máquina)', 'legcurl', 'maquina', 2.5, 'Una pierna cada vez. Controla la bajada.'),

  // --- Extensión cuádriceps
  E('Leg_Extensions', 'Extensión de cuádriceps (máquina)', 'legext', 'maquina', 2.5, 'Sentado, rodilla alineada con el eje. Estira las piernas y aguanta 1 segundo arriba.'),
  E('Single-Leg_Leg_Extension', 'Extensión de cuádriceps a una pierna', 'legext', 'maquina', 2.5, 'Igual que la normal pero una pierna cada vez. Útil para corregir descompensaciones.'),

  // --- Zancadas
  E('Split_Squat_with_Dumbbells', 'Sentadilla búlgara / split squat con mancuernas', 'lunge', 'mancuernas', 2, 'Un pie adelantado, el otro atrás. Baja recto hasta que la rodilla trasera casi toque el suelo.'),
  E('Dumbbell_Lunges', 'Zancadas con mancuernas', 'lunge', 'mancuernas', 2, 'Paso largo adelante, baja controlado y vuelve. Alterna piernas.'),
  E('Dumbbell_Step_Ups', 'Subidas al banco con mancuernas', 'lunge', 'mancuernas', 2, 'Sube a un banco o cajón empujando con la pierna de arriba, no con la de abajo.'),
  E('Smith_Single-Leg_Split_Squat', 'Split squat en Smith', 'lunge', 'smith', 5, 'Zancada estática con la barra guiada: más estable.'),

  // --- Empuje horizontal
  E('Machine_Bench_Press', 'Press de pecho en máquina', 'hpush', 'maquina', 5, 'Agarres a la altura del pecho medio. Empuja sin despegar la espalda del respaldo y vuelve lento.'),
  E('Leverage_Chest_Press', 'Press de pecho en máquina de palanca', 'hpush', 'maquina', 5, 'Máquina con discos o placas y brazos independientes. Omóplatos juntos y hacia abajo.'),
  E('Dumbbell_Bench_Press', 'Press de banca con mancuernas', 'hpush', 'mancuernas', 2, 'Tumbado, mancuernas a la altura del pecho, codos a ~45° del cuerpo. Empuja hacia arriba juntándolas ligeramente.'),
  E('Barbell_Bench_Press_-_Medium_Grip', 'Press de banca con barra', 'hpush', 'barra', 2.5, 'Agarre algo más ancho que los hombros, baja la barra al pecho medio con control. Pide a alguien que te ayude si vas pesado.'),
  E('Smith_Machine_Bench_Press', 'Press de banca en Smith', 'hpush', 'smith', 5, 'Banco plano bajo la barra guiada; baja al pecho medio.'),
  E('Pushups', 'Flexiones', 'hpush', 'corporal', 0, 'Cuerpo recto de cabeza a talones. Si son muy difíciles, apoya las manos en un banco.', { mode: 'reps' }),

  // --- Empuje inclinado
  E('Incline_Dumbbell_Press', 'Press inclinado con mancuernas', 'ipush', 'mancuernas', 2, 'Banco a 30°. Mancuernas a la altura de la parte alta del pecho, empuja hacia arriba.'),
  E('Leverage_Incline_Chest_Press', 'Press inclinado en máquina', 'ipush', 'maquina', 5, 'Máquina con trayectoria inclinada. Espalda pegada al respaldo.'),
  E('Smith_Machine_Incline_Bench_Press', 'Press inclinado en Smith', 'ipush', 'smith', 5, 'Banco a 30° bajo la barra guiada; baja a la parte alta del pecho.'),
  E('Barbell_Incline_Bench_Press_-_Medium_Grip', 'Press inclinado con barra', 'ipush', 'barra', 2.5, 'Banco inclinado, barra a la parte alta del pecho.'),

  // --- Press hombro
  E('Machine_Shoulder_Military_Press', 'Press de hombro en máquina', 'vpush', 'maquina', 5, 'Sentado, agarres a la altura de los hombros. Empuja hacia arriba sin arquear la espalda.'),
  E('Dumbbell_Shoulder_Press', 'Press de hombro con mancuernas', 'vpush', 'mancuernas', 2, 'Sentado con respaldo, mancuernas a la altura de las orejas. Empuja hacia arriba.'),
  E('Smith_Machine_Overhead_Shoulder_Press', 'Press de hombro en Smith', 'vpush', 'smith', 2.5, 'Sentado bajo la barra guiada, bájala por delante de la cara hasta la barbilla.'),
  E('Seated_Cable_Shoulder_Press', 'Press de hombro en polea', 'vpush', 'polea', 2.5, 'Sentado entre dos poleas bajas, empuja hacia arriba.'),

  // --- Tirón vertical
  E('Wide-Grip_Lat_Pulldown', 'Jalón al pecho (polea alta)', 'vpull', 'polea', 5, 'Agarre algo más ancho que los hombros. Lleva la barra a la parte alta del pecho sacando pecho y juntando omóplatos. No te balancees.'),
  E('Close-Grip_Front_Lat_Pulldown', 'Jalón agarre estrecho', 'vpull', 'polea', 5, 'Agarre estrecho, palmas hacia ti o neutras. Lleva el agarre al pecho.'),
  E('V-Bar_Pulldown', 'Jalón con agarre en V (neutro)', 'vpull', 'polea', 5, 'Triángulo en la polea alta, codos hacia abajo y atrás.'),
  E('Band_Assisted_Pull-Up', 'Dominadas asistidas (goma o máquina)', 'vpull', 'corporal', 0, 'Usa una goma o la máquina de dominadas asistidas. Sube hasta pasar la barbilla de la barra.', { mode: 'reps' }),
  E('Pullups', 'Dominadas', 'vpull', 'corporal', 0, 'Desde brazos estirados hasta pasar la barbilla. Controla la bajada.', { mode: 'reps' }),

  // --- Remo
  E('Seated_Cable_Rows', 'Remo sentado en polea baja', 'hpull', 'polea', 5, 'Espalda recta, tira del agarre hacia el ombligo juntando omóplatos. No te eches hacia atrás.'),
  E('Leverage_Iso_Row', 'Remo en máquina', 'hpull', 'maquina', 5, 'Pecho apoyado en la almohadilla, tira con los codos hacia atrás.'),
  E('Leverage_High_Row', 'Remo alto en máquina', 'hpull', 'maquina', 5, 'Tira de arriba hacia abajo y atrás. Mezcla de jalón y remo.'),
  E('One-Arm_Dumbbell_Row', 'Remo con mancuerna a una mano', 'hpull', 'mancuernas', 2, 'Rodilla y mano en un banco, tira de la mancuerna hacia la cadera.'),
  E('Lying_T-Bar_Row', 'Remo T con pecho apoyado', 'hpull', 'maquina', 5, 'Pecho apoyado en la máquina de remo T, tira con los codos pegados.'),
  E('Bent_Over_Barbell_Row', 'Remo con barra', 'hpull', 'barra', 2.5, 'Tronco inclinado ~45°, espalda recta, lleva la barra al ombligo.'),

  // --- Laterales
  E('Side_Lateral_Raise', 'Elevaciones laterales con mancuernas', 'lateral', 'mancuernas', 1, 'De pie, codos ligeramente flexionados. Sube los brazos a los lados hasta la altura de los hombros. Peso ligero, sin balanceo.'),
  E('Cable_Seated_Lateral_Raise', 'Elevación lateral en polea', 'lateral', 'polea', 1.25, 'Polea baja, un brazo cada vez, sube hasta el hombro.'),
  E('Seated_Side_Lateral_Raise', 'Elevaciones laterales sentado', 'lateral', 'mancuernas', 1, 'Sentado para evitar el balanceo.'),

  // --- Deltoides posterior
  E('Face_Pull', 'Face pull (polea con cuerda)', 'reardelt', 'polea', 2.5, 'Polea a la altura de la cara con cuerda. Tira hacia la frente separando las manos, codos altos.'),
  E('Reverse_Machine_Flyes', 'Pájaros en máquina (contractor inverso)', 'reardelt', 'maquina', 2.5, 'En la máquina de aperturas mirando hacia ella. Abre los brazos hacia atrás.'),
  E('Cable_Rear_Delt_Fly', 'Pájaros en polea', 'reardelt', 'polea', 1.25, 'Poleas cruzadas a la altura de los hombros, abre los brazos.'),
  E('Seated_Bent-Over_Rear_Delt_Raise', 'Pájaros con mancuernas', 'reardelt', 'mancuernas', 1, 'Sentado, inclinado hacia delante, abre los brazos a los lados.'),

  // --- Aperturas
  E('Butterfly', 'Contractor de pecho (pec deck)', 'fly', 'maquina', 2.5, 'Sentado, brazos abiertos, junta los agarres delante del pecho y vuelve lento.'),
  E('Flat_Bench_Cable_Flyes', 'Aperturas en polea', 'fly', 'polea', 1.25, 'Entre dos poleas, codos ligeramente flexionados, junta las manos delante.'),
  E('Dumbbell_Flyes', 'Aperturas con mancuernas', 'fly', 'mancuernas', 1, 'Tumbado, abre los brazos con codos flexionados hasta notar estiramiento.'),

  // --- Bíceps
  E('Dumbbell_Bicep_Curl', 'Curl de bíceps con mancuernas', 'biceps', 'mancuernas', 1, 'Codos pegados al cuerpo, sube girando la palma hacia arriba. Sin balanceo.'),
  E('Standing_Biceps_Cable_Curl', 'Curl de bíceps en polea', 'biceps', 'polea', 2.5, 'Polea baja con barra, codos fijos.'),
  E('Machine_Bicep_Curl', 'Curl de bíceps en máquina', 'biceps', 'maquina', 2.5, 'Codos apoyados en la almohadilla.'),
  E('Hammer_Curls', 'Curl martillo', 'biceps', 'mancuernas', 1, 'Palmas mirándose entre sí. Trabaja también el antebrazo.'),
  E('EZ-Bar_Curl', 'Curl con barra Z', 'biceps', 'barra', 2.5, 'Barra con forma de zigzag, más cómoda para las muñecas.'),

  // --- Tríceps
  E('Triceps_Pushdown_-_Rope_Attachment', 'Extensión de tríceps en polea (cuerda)', 'triceps', 'polea', 2.5, 'Codos pegados al cuerpo, estira los brazos abriendo la cuerda abajo.'),
  E('Triceps_Pushdown', 'Extensión de tríceps en polea (barra)', 'triceps', 'polea', 2.5, 'Igual con barra recta o V.'),
  E('Cable_Rope_Overhead_Triceps_Extension', 'Extensión de tríceps sobre la cabeza (polea)', 'triceps', 'polea', 2.5, 'De espaldas a la polea, estira los brazos por encima de la cabeza.'),
  E('Machine_Triceps_Extension', 'Extensión de tríceps en máquina', 'triceps', 'maquina', 2.5, 'Codos apoyados, estira los brazos.'),
  E('Standing_Dumbbell_Triceps_Extension', 'Extensión de tríceps con mancuerna', 'triceps', 'mancuernas', 1, 'Una mancuerna con las dos manos detrás de la cabeza, estira hacia arriba.'),

  // --- Gemelos
  E('Standing_Calf_Raises', 'Gemelos de pie (máquina)', 'calves', 'maquina', 5, 'Puntas en el borde, baja el talón todo lo posible y sube al máximo. Pausa abajo.'),
  E('Calf_Press_On_The_Leg_Press_Machine', 'Gemelos en prensa', 'calves', 'maquina', 5, 'En la prensa, solo la punta de los pies en el borde inferior de la plataforma.'),
  E('Seated_Calf_Raise', 'Gemelos sentado (máquina)', 'calves', 'maquina', 5, 'Sentado, almohadilla sobre las rodillas.'),
  E('Smith_Machine_Calf_Raise', 'Gemelos en Smith', 'calves', 'smith', 5, 'Puntas sobre un disco o step, barra en los hombros.'),

  // --- Core
  E('Plank', 'Plancha abdominal', 'core', 'corporal', 0, 'Antebrazos en el suelo, cuerpo recto, aprieta abdomen y glúteos. Apunta los segundos.', { mode: 'time' }),
  E('Cable_Crunch', 'Crunch en polea (rodillas)', 'core', 'polea', 2.5, 'De rodillas frente a la polea alta con cuerda. Enrolla el tronco llevando los codos a los muslos.'),
  E('Ab_Crunch_Machine', 'Crunch en máquina', 'core', 'maquina', 2.5, 'Máquina de abdominales: enrolla el tronco sin tirar con los brazos.'),
  E('Hanging_Leg_Raise', 'Elevación de piernas colgado', 'core', 'corporal', 0, 'Colgado de una barra, sube las rodillas o las piernas sin balanceo.', { mode: 'reps' }),
  E('Dead_Bug', 'Dead bug', 'core', 'corporal', 0, 'Boca arriba, brazos y piernas arriba. Estira brazo y pierna contrarios sin despegar la lumbar.', { mode: 'reps' }),
];

export const EX_BY_ID = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

export const EQ_NAMES = {
  maquina: 'Máquina', polea: 'Polea', mancuernas: 'Mancuernas', barra: 'Barra', smith: 'Smith', corporal: 'Peso corporal',
};

export function imgUrl(id, n = 0) {
  return `${IMG_BASE}${id}/${n}.jpg`;
}

export function alternatives(exId) {
  const ex = EX_BY_ID[exId];
  if (!ex) return [];
  return EXERCISES.filter(e => e.pattern === ex.pattern && e.id !== exId);
}
