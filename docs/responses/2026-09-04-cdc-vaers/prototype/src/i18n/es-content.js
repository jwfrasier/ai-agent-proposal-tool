// Spanish content layer — PWS 1.13 / PRS#19 (Amendment 0002).
//
// Same schema, second language: every key here is a content PATH in the
// base schema (section.<id>.title.plain, field.<id>.label.clinical,
// field.<id>.option.<value>, faq.<i>.q, site.heroTitle, …) — exactly the
// key space the low-code admin overrides use. The store applies this layer
// when the locale is Spanish and then applies any admin overrides made in
// Spanish on top, so program personnel edit Spanish text through the same
// screen they edit English. Nothing here is a code path; it is content.
//
// Register: "usted" for the public path, clinical Spanish for the provider
// path. Proper nouns (state names, vaccine brands) are not translated.

export const esContent = {
  // ---- site text (landing) ----
  "site.heroTitle":
    "Reporte una posible reacción o un error de vacunación en minutos, desde cualquier dispositivo.",
  "site.heroLede":
    "El Sistema de Notificación de Eventos Adversos a Vacunas (VAERS) es el sistema nacional de alerta temprana sobre la seguridad de las vacunas. Su reporte importa, aunque no esté seguro de que la vacuna fue la causa.",
  "site.noticeText":
    "Llame al 911 o comuníquese con su proveedor de salud ahora. VAERS recopila reportes de seguridad; no brinda atención ni consejos médicos.",

  // ---- sections ----
  "section.path.title.clinical": "Sobre este reporte",
  "section.path.title.plain": "Sobre este reporte",
  "section.patient.title.clinical": "Información del paciente",
  "section.patient.title.plain": "Quién recibió la vacuna",
  "section.vaccine.title.clinical": "Datos de la vacuna",
  "section.vaccine.title.plain": "Sobre la vacuna",
  "section.error.title.clinical": "Error de administración de la vacuna",
  "section.error.title.plain": "Error de administración de la vacuna",
  "section.event.title.clinical": "Evento adverso",
  "section.event.title.plain": "Qué pasó después de la vacuna",
  "section.event.suppressedNote":
    "Las preguntas sobre eventos adversos están ocultas porque este reporte es un error de administración sin evento adverso.",
  "section.health.title.clinical": "Antecedentes médicos",
  "section.health.title.plain": "Antecedentes de salud",
  "section.docs.title.clinical": "Documentos de respaldo",
  "section.docs.title.plain": "Documentos de respaldo",
  "section.reporter.title.clinical": "Sobre usted (persona que completa este formulario)",
  "section.reporter.title.plain": "Sobre usted",

  // ---- path ----
  "field.submitterType.label.clinical": "¿Quién presenta este reporte?",
  "field.submitterType.label.plain": "¿Quién está llenando este reporte?",
  "field.submitterType.option.public": "Paciente, padre/madre o miembro del público",
  "field.submitterType.option.public.detail":
    "Usted o alguien a su cuidado tuvo un problema de salud después de una vacuna. No se necesita formación médica.",
  "field.submitterType.option.provider": "Profesional de la salud",
  "field.submitterType.option.provider.detail":
    "Usted es clínico, farmacéutico o vacunador y reporta en nombre de un paciente.",
  "field.submitterType.tooltip":
    "Su respuesta adapta el resto del formulario. La versión pública usa lenguaje cotidiano; la versión profesional usa términos clínicos.",
  "field.reportType.label.clinical": "¿Qué está reportando?",
  "field.reportType.label.plain": "¿Qué está reportando?",
  "field.reportType.option.adverse_event": "Un evento adverso después de la vacunación",
  "field.reportType.option.adverse_event.detail":
    "El paciente tuvo un problema de salud después de una vacuna.",
  "field.reportType.option.vaccine_error_no_ae":
    "Un error de administración de la vacuna sin evento adverso",
  "field.reportType.option.vaccine_error_no_ae.detail":
    "Dosis, producto, sitio, esquema o almacenamiento incorrectos, sin problema de salud para el paciente. Se omitirán las preguntas sobre eventos adversos.",
  "field.reportType.option.both": "Un error de administración Y un evento adverso",
  "field.reportType.option.both.detail":
    "Ocurrió un error y además el paciente tuvo un problema de salud.",
  "field.reportType.tooltip":
    "Si selecciona un error sin evento adverso, el formulario elimina todas las preguntas sobre eventos adversos y el reporte toma solo unos minutos.",

  // ---- patient ----
  "field.patientName.label.clinical": "Nombre del paciente (apellido, nombre)",
  "field.patientName.label.plain": "Nombre de la persona que recibió la vacuna",
  "field.patientName.help.plain": "Puede ser usted, su hijo o hija, o alguien a su cuidado.",
  "field.patientName.tooltip":
    "VAERS mantiene los nombres confidenciales. La identidad del paciente ayuda a los CDC y la FDA a dar seguimiento si se necesita más información.",
  "field.dob.label.clinical": "Fecha de nacimiento",
  "field.dob.label.plain": "Su fecha de nacimiento",
  "field.dob.validate.0": "La fecha de nacimiento no puede estar en el futuro.",
  "field.sex.label.clinical": "Sexo",
  "field.sex.label.plain": "Sexo",
  "field.sex.option.female": "Femenino",
  "field.sex.option.male": "Masculino",
  "field.sex.option.unknown": "Se desconoce",
  "field.pregnant.label.clinical": "¿Embarazada al momento de la vacunación?",
  "field.pregnant.label.plain": "¿Estaba embarazada cuando recibió la vacuna?",
  "field.pregnant.option.yes": "Sí",
  "field.pregnant.option.no": "No",
  "field.pregnant.option.unknown": "No estoy seguro/a",
  "field.ageAtVax.label.clinical": "Edad al momento de la vacunación (años)",
  "field.ageAtVax.label.plain": "¿Qué edad tenía cuando recibió la vacuna?",
  "field.ageAtVax.validate.0":
    "Escriba la edad en años como un número (use 0 si es menor de 1 año).",
  "field.race.label.clinical": "Raza (seleccione todas las que apliquen)",
  "field.race.label.plain": "Raza (opcional, seleccione todas las que apliquen)",
  "field.race.help.plain":
    "Esto ayuda a los CDC a asegurarse de que la vigilancia de seguridad de las vacunas cubra a todas las personas.",
  "field.race.option.aian": "Indígena americano o nativo de Alaska",
  "field.race.option.asian": "Asiático",
  "field.race.option.black": "Negro o afroamericano",
  "field.race.option.nhpi": "Nativo de Hawái u otras islas del Pacífico",
  "field.race.option.white": "Blanco",
  "field.race.option.other": "Otra",
  "field.race.option.unknown": "Prefiero no decirlo / se desconoce",
  "field.ethnicity.label.clinical": "Etnia",
  "field.ethnicity.label.plain": "Etnia (opcional)",
  "field.ethnicity.option.hispanic": "Hispano o latino",
  "field.ethnicity.option.not_hispanic": "No hispano ni latino",
  "field.ethnicity.option.unknown": "Prefiero no decirlo / se desconoce",
  "field.patientAddress.label.clinical": "Dirección (calle, ciudad, código postal)",
  "field.patientAddress.label.plain": "Su dirección de residencia",
  "field.patientState.label.clinical": "Estado",
  "field.patientState.label.plain": "Estado",
  "field.patientState.option.FR": "Extranjero",
  "field.patientState.option.DC": "Distrito de Columbia",
  "field.patientState.option.VI": "Islas Vírgenes de los EE. UU.",
  "field.patientState.option.AS": "Samoa Americana",
  "field.patientState.option.MP": "Islas Marianas del Norte",
  "field.patientPhone.label.clinical": "Número de teléfono",
  "field.patientPhone.label.plain": "Número de teléfono (si tiene)",
  "field.patientEmail.label.clinical": "Correo electrónico",
  "field.patientEmail.label.plain": "Correo electrónico (si tiene)",
  "field.patientEmail.validate.0": "Escriba un correo como nombre@ejemplo.com.",

  // ---- vaccine ----
  "field.vaxDate.label.clinical": "Fecha de vacunación",
  "field.vaxDate.label.plain": "¿Qué día se aplicó la vacuna?",
  "field.vaxDate.validate.0": "La fecha de vacunación no puede estar en el futuro.",
  "field.vaxDate.tooltip":
    "La fecha exacta es lo que más importa. Si no está seguro, su tarjeta de vacunación, el recibo de la farmacia o el portal del paciente la tienen.",
  "field.vaxTime.label.clinical": "Hora de la vacunación (si se conoce)",
  "field.vaxTime.label.plain": "¿Aproximadamente a qué hora se aplicó? (opcional)",
  "field.vaccineName.label.clinical": "Vacuna (tipo / marca)",
  "field.vaccineName.label.plain": "¿Cuál vacuna fue?",
  "field.vaccineName.help.plain":
    "Revise la tarjeta de vacunación o pregunte en el lugar donde la aplicaron.",
  "field.vaccineName.option.influenza": "Influenza (gripe)",
  "field.vaccineName.option.mmr": "MMR (sarampión, paperas, rubéola)",
  "field.vaccineName.option.tdap": "Tdap (tétanos, difteria, tos ferina)",
  "field.vaccineName.option.shingles": "Herpes zóster (culebrilla)",
  "field.vaccineName.option.pneumococcal": "Neumocócica",
  "field.vaccineName.option.hepb": "Hepatitis B",
  "field.vaccineName.option.rsv": "VRS (virus respiratorio sincitial)",
  "field.vaccineName.option.other": "Otra / no estoy seguro/a",
  "field.vaccineBrand.label.clinical": "Nombre comercial (según registro)",
  "field.vaccineBrand.label.plain": "Nombre de la marca, si lo sabe",
  "field.manufacturer.label.clinical": "Fabricante",
  "field.manufacturer.label.plain": "¿Quién la fabrica? (si lo sabe)",
  "field.lotNumber.label.clinical": "Número de lote",
  "field.lotNumber.label.plain": "Número de lote (de la tarjeta de vacunación, si la tiene)",
  "field.lotNumber.tooltip":
    "El número de lote vincula el reporte con un lote específico de vacuna; es uno de los datos más valiosos para la vigilancia de seguridad. Está impreso en la tarjeta de vacunación o en el registro del proveedor.",
  "field.doseNumber.label.clinical": "Número de dosis en la serie",
  "field.doseNumber.label.plain": "¿Qué dosis fue esta?",
  "field.doseNumber.option.1": "1.ª",
  "field.doseNumber.option.2": "2.ª",
  "field.doseNumber.option.3": "3.ª",
  "field.doseNumber.option.4+": "4.ª o posterior",
  "field.doseNumber.option.unknown": "No estoy seguro/a",
  "field.route.label.clinical": "Vía de administración",
  "field.route.label.plain": "Vía",
  "field.route.option.IM": "Intramuscular (IM)",
  "field.route.option.SC": "Subcutánea (SC)",
  "field.route.option.ID": "Intradérmica (ID)",
  "field.route.option.IN": "Intranasal (IN)",
  "field.route.option.PO": "Oral (PO)",
  "field.route.option.other": "Otra",
  "field.bodySite.label.clinical": "Sitio anatómico",
  "field.bodySite.label.plain": "Parte del cuerpo",
  "field.bodySite.option.LA": "Brazo izquierdo",
  "field.bodySite.option.RA": "Brazo derecho",
  "field.bodySite.option.LL": "Pierna izquierda",
  "field.bodySite.option.RL": "Pierna derecha",
  "field.bodySite.option.other": "Otro / se desconoce",
  "field.otherVaccines.label.clinical":
    "Otras vacunas administradas en las 4 semanas previas",
  "field.otherVaccines.label.plain":
    "¿Alguna otra vacuna en las 4 semanas anteriores a esta?",
  "field.otherVaccines.help.clinical":
    "Incluya producto, fecha y sitio si se conocen.",
  "field.otherVaccines.help.plain": "Si no hubo ninguna, deje esto en blanco.",
  "field.facilityName.label.clinical": "Establecimiento donde se administró la vacuna",
  "field.facilityName.label.plain":
    "¿Dónde se aplicó la vacuna? (consultorio, farmacia, clínica…)",
  "field.facilityType.label.clinical": "Tipo de establecimiento",
  "field.facilityType.label.plain": "Tipo de establecimiento",
  "field.facilityType.option.doctor_office": "Consultorio médico / clínica",
  "field.facilityType.option.hospital": "Hospital",
  "field.facilityType.option.pharmacy": "Farmacia",
  "field.facilityType.option.public_health": "Clínica de salud pública",
  "field.facilityType.option.workplace": "Clínica del lugar de trabajo",
  "field.facilityType.option.school": "Escuela / salud estudiantil",
  "field.facilityType.option.other": "Otro",
  "field.bestDoctor.label.clinical":
    "Médico o profesional de la salud más indicado para consultar sobre este evento (nombre, teléfono)",
  "field.bestDoctor.label.plain":
    "Un médico o clínica a quien podríamos preguntar sobre lo ocurrido (opcional)",
  "field.bestDoctor.tooltip":
    "Se usa solo si el personal de seguridad de los CDC o la FDA necesita detalles clínicos para completar la revisión.",

  // ---- error ----
  "field.errorType.label.clinical":
    "Tipo de error de administración (seleccione todos los que apliquen)",
  "field.errorType.label.plain":
    "Tipo de error de administración (seleccione todos los que apliquen)",
  "field.errorType.option.wrong_product": "Se administró la vacuna o el producto equivocado",
  "field.errorType.option.wrong_dose": "Dosis incorrecta (demasiada / muy poca)",
  "field.errorType.option.wrong_route": "Vía o sitio anatómico incorrecto",
  "field.errorType.option.wrong_schedule":
    "Administrada fuera del esquema o intervalo recomendado",
  "field.errorType.option.expired": "Producto vencido o mal almacenado",
  "field.errorType.option.wrong_patient": "Paciente equivocado / confusión",
  "field.errorType.option.other_error": "Otro error",
  "field.errorDescription.label.clinical": "Describa el error y cómo se identificó",
  "field.errorDescription.label.plain": "Describa el error y cómo se identificó",
  "field.errorDescription.help.clinical":
    "Incluya lo previsto, lo ocurrido y cualquier medida correctiva tomada.",

  // ---- event ----
  "field.symptoms.label.clinical":
    "Describa el o los eventos adversos, el tratamiento y el desenlace",
  "field.symptoms.label.plain": "Cuéntenos qué pasó. ¿Qué síntomas tuvo?",
  "field.symptoms.help.clinical":
    "Signos, síntomas, evolución temporal, tratamiento clínicamente relevante y estado actual.",
  "field.symptoms.help.plain":
    "Descríbalo con sus propias palabras: qué notó, cuándo empezó y cómo evolucionó. No necesita términos médicos.",
  "field.symptoms.tooltip":
    "Este es el dato más importante de todo el reporte. Más detalle, incluso en palabras cotidianas, hace el reporte más útil para los científicos de seguridad de los CDC y la FDA.",
  "field.onsetDate.label.clinical": "Fecha de inicio del evento adverso",
  "field.onsetDate.label.plain": "¿Qué día empezaron los síntomas?",
  "field.onsetDate.validate.0": "La fecha de inicio no puede estar en el futuro.",
  "field.onsetDate.validate.1":
    "La fecha de inicio de los síntomas es anterior a la fecha de vacunación. Verifique ambas fechas.",
  "field.outcomes.label.clinical":
    "Desenlaces del evento adverso (seleccione todos los que apliquen)",
  "field.outcomes.label.plain":
    "¿Ocurrió alguna de estas cosas? (seleccione todas las que apliquen)",
  "field.outcomes.option.er_visit": "Visita a la sala de emergencias o a atención urgente",
  "field.outcomes.option.doctor_visit": "Visita al médico o a la clínica",
  "field.outcomes.option.hospitalization": "Hospitalización",
  "field.outcomes.option.prolonged_hosp": "Se prolongó una hospitalización en curso",
  "field.outcomes.option.life_threatening": "Evento con riesgo de muerte",
  "field.outcomes.option.disability": "Discapacidad o daño permanente",
  "field.outcomes.option.birth_defect": "Anomalía congénita / defecto de nacimiento",
  "field.outcomes.option.death": "El paciente falleció",
  "field.outcomes.option.none": "Ninguna de las anteriores",
  "field.outcomes.tooltip":
    "Estas casillas determinan si el reporte se clasifica como grave según las regulaciones federales.",
  "field.hospDays.label.clinical": "Número de días de hospitalización",
  "field.hospDays.label.plain": "¿Cuántos días estuvo en el hospital?",
  "field.hospDays.validate.0": "Escriba el número de días como un número.",
  "field.deathDate.label.clinical": "Fecha de fallecimiento",
  "field.deathDate.label.plain": "Fecha de fallecimiento",
  "field.recovered.label.clinical": "¿El paciente se ha recuperado?",
  "field.recovered.label.plain": "¿Ya está mejor?",
  "field.recovered.option.yes": "Sí",
  "field.recovered.option.no": "No",
  "field.recovered.option.unknown": "No estoy seguro/a",
  "field.labs.label.clinical": "Pruebas diagnósticas / datos de laboratorio relevantes",
  "field.labs.label.plain":
    "¿Alguna prueba médica relacionada con lo que pasó? (opcional)",
  "field.labs.help.clinical": "Incluya fechas y resultados.",
  "field.labs.help.plain":
    "Por ejemplo, análisis de sangre o estudios de imagen. Deje en blanco si no hubo o no está seguro.",

  // ---- health ----
  "field.conditions.label.clinical": "Afecciones crónicas o de larga duración",
  "field.conditions.label.plain":
    "¿Alguna afección de salud continua? (asma, diabetes, etc.)",
  "field.conditions.help.plain": "Si no hay ninguna, deje esto en blanco.",
  "field.allergies.label.clinical": "Alergias a medicamentos, alimentos u otros productos",
  "field.allergies.label.plain": "¿Alguna alergia? (medicamentos, alimentos, látex…)",
  "field.medications.label.clinical": "Medicamentos al momento de la vacunación",
  "field.medications.label.plain":
    "¿Qué medicamentos tomaba cuando recibió la vacuna?",
  "field.medications.help.clinical":
    "Incluya recetados, de venta libre y suplementos.",
  "field.medications.help.plain":
    "Incluya también vitaminas y medicamentos de venta libre.",
  "field.illness.label.clinical":
    "Enfermedad al momento de la vacunación (o en el mes previo)",
  "field.illness.label.plain": "¿Estaba enfermo/a cerca de la fecha de la vacuna?",
  "field.priorAE.label.clinical":
    "¿Antecedente de eventos adversos tras vacunaciones previas?",
  "field.priorAE.label.plain": "¿Alguna vez tuvo una reacción a una vacuna?",
  "field.priorAE.option.yes": "Sí",
  "field.priorAE.option.no": "No",
  "field.priorAE.option.unknown": "No estoy seguro/a",
  "field.priorAEDetails.label.clinical":
    "Describa el evento adverso previo (evento, vacuna, dosis en la serie, edad en ese momento)",
  "field.priorAEDetails.label.plain":
    "Cuéntenos sobre esa reacción anterior (qué pasó, cuál vacuna, qué edad tenía)",

  // ---- docs ----
  "field.uploads.label.clinical": "Cargar expedientes médicos o documentos de la vacuna",
  "field.uploads.label.plain": "Agregue documentos si los tiene (opcional)",
  "field.uploads.help.clinical":
    "En la Fase 1 se aceptan expedientes médicos y documentos de la vacuna relacionados con la vacunación o el evento reportado.",
  "field.uploads.help.plain":
    "Por ejemplo, un resumen de la visita, el registro de vacunación o los papeles del alta. También puede agregar documentos después; los reportes son útiles con o sin ellos.",
  "field.additionalInfo.label.clinical": "Información adicional (texto libre)",
  "field.additionalInfo.label.plain": "¿Algo más que quiera contarnos?",

  // ---- reporter ----
  "field.reporterName.label.clinical": "Su nombre",
  "field.reporterName.label.plain": "Su nombre",
  "field.reporterRelation.label.clinical": "Relación con el paciente",
  "field.reporterRelation.label.plain":
    "¿Qué relación tiene con la persona que recibió la vacuna?",
  "field.reporterRelation.option.self": "Soy el paciente",
  "field.reporterRelation.option.parent": "Padre, madre o tutor",
  "field.reporterRelation.option.family": "Otro familiar",
  "field.reporterRelation.option.other": "Otra",
  "field.reporterCredentials.label.clinical": "Función profesional",
  "field.reporterCredentials.label.plain": "Función profesional",
  "field.reporterCredentials.option.md_do": "Médico (MD/DO)",
  "field.reporterCredentials.option.np_pa": "Enfermero/a de práctica avanzada / asistente médico",
  "field.reporterCredentials.option.rn": "Enfermero/a (RN/LPN)",
  "field.reporterCredentials.option.pharmacist": "Farmacéutico/a",
  "field.reporterCredentials.option.other_hcp": "Otro profesional de la salud",
  "field.reporterPhone.label.clinical": "Número de teléfono",
  "field.reporterPhone.label.plain": "Número de teléfono",
  "field.reporterPhone.tooltip":
    "Se usa solo si los CDC o la FDA necesitan dar seguimiento para completar la revisión de seguridad.",
  "field.reporterEmail.label.clinical": "Correo electrónico",
  "field.reporterEmail.label.plain": "Correo electrónico",
  "field.reporterEmail.validate.0": "Escriba un correo como nombre@ejemplo.com.",
  "field.attestation.label.clinical": "Certificación",
  "field.attestation.label.plain": "Antes de enviar",
  "field.attestation.option.true_correct":
    "La información de este reporte es verdadera y correcta según mi leal saber y entender.",

  // ---- FAQ ----
  "faq.0.q": "¿Qué es VAERS?",
  "faq.0.a":
    "El Sistema de Notificación de Eventos Adversos a Vacunas es el sistema nacional de alerta temprana administrado conjuntamente por los CDC y la FDA. Cualquier persona puede reportar un problema de salud ocurrido después de una vacunación: pacientes, familiares y profesionales de la salud.",
  "faq.1.q": "¿Reportar significa que la vacuna causó el problema?",
  "faq.1.a":
    "No. Un reporte a VAERS no significa que la vacuna causó el evento, solo que el evento ocurrió después de la vacunación. Los científicos usan el patrón de los reportes para detectar posibles señales de seguridad que ameriten un estudio más profundo.",
  "faq.2.q": "¿Necesito expedientes médicos para presentar un reporte?",
  "faq.2.a":
    "No. Envíe lo que sabe; un reporte es valioso aun sin documentos. Puede agregar documentos ahora o después de enviarlo.",
  "faq.3.q": "¿Se mantiene privada mi información?",
  "faq.3.a":
    "Sí. La información de identificación personal se mantiene confidencial y está protegida por la ley federal de privacidad. Las publicaciones de datos de VAERS nunca incluyen nombres ni datos de contacto.",
  "faq.4.q": "¿Cuánto tiempo toma un reporte?",
  "faq.4.a":
    "La mayoría de las personas termina en menos de 10 minutos. Su avance se guarda en su dispositivo a medida que avanza, así que puede hacer una pausa y volver.",
  "faq.5.q": "¿Quién está obligado a reportar?",
  "faq.5.a":
    "Los proveedores de salud están obligados por ley a reportar ciertos eventos adversos posteriores a la vacunación, y los fabricantes de vacunas deben reportar todos los eventos adversos de los que tengan conocimiento. A todos los demás se les anima a reportar cualquier cosa que les preocupe.",
  "faq.6.q": "¿Qué es un error de administración de la vacuna?",
  "faq.6.a":
    "Un error en la forma en que se aplicó la vacuna: dosis, producto, sitio, esquema o almacenamiento incorrectos. Los profesionales de la salud pueden reportar un error aunque el paciente no haya tenido ningún problema de salud, y en ese caso el formulario omite todas las preguntas sobre eventos adversos.",

  // ---- supplemental-document suggestions (PWS 2.3) ----
  "suggest.hospital-records":
    "Resumen del alta hospitalaria de la admisión relacionada con este evento",
  "suggest.er-records": "Nota de la visita al servicio de emergencias",
  "suggest.death-records": "Certificado de defunción e informe de autopsia, si se realizó",
  "suggest.lab-results": "Resultados de laboratorio o de pruebas diagnósticas que mencionó",
  "suggest.vax-record-error":
    "Registro de administración de la vacuna con producto, lote, dosis y sitio",
  "suggest.lot-doc":
    "Registro de almacenamiento/temperatura o documentación de la fecha de vencimiento del producto",
  "suggest.office-visit": "Nota de la consulta que documente la evaluación del evento",

  // ---- scripted assistant (fallback when live AI is unavailable) ----
  "assistant.0":
    "El número de lote está impreso en la tarjeta de vacunación que recibió, y la clínica o farmacia que aplicó la vacuna también lo tiene registrado. Si no lo encuentra, déjelo en blanco; igual puede enviar el reporte.",
  "assistant.1":
    "Los campos marcados con un asterisco rojo son necesarios para procesar el reporte. Todo lo demás es opcional: envíe lo que sabe. El medidor de avance de esta página muestra lo que aún falta.",
  "assistant.2":
    "La información personal de los reportes a VAERS es confidencial y está protegida por la ley federal de privacidad. Los datos publicados de VAERS nunca incluyen nombres ni datos de contacto.",
  "assistant.3":
    "Para enviar un reporte no hace falta saber si la vacuna causó el problema. Reporte cualquier cosa preocupante que haya ocurrido después de la vacunación; los científicos de seguridad analizan los patrones.",
  "assistant.4":
    "Su avance se guarda automáticamente en este dispositivo. Puede cerrar esta página y retomar donde se quedó.",
  "assistant.5":
    "Los profesionales de la salud pueden reportar un error de administración de la vacuna aunque no haya ocurrido ningún problema de salud. Elija «error de administración sin evento adverso» al inicio y el formulario omitirá todas las preguntas sobre eventos adversos.",
  "assistant.6":
    "Puede adjuntar expedientes médicos o documentos de la vacuna (archivos PDF o de texto). En esta fase no se aceptan fotos ni imágenes médicas. Los documentos son opcionales; los reportes son útiles sin ellos.",
  "assistant.7":
    "Si se trata de una emergencia médica, llame al 911 o comuníquese con un proveedor de salud ahora; VAERS es un sistema de reportes, no un servicio médico. Para el reporte, marque todos los desenlaces que apliquen. Esas respuestas clasifican la gravedad del reporte.",
  "assistant.fallback":
    "Puedo ayudarle con preguntas sobre cómo llenar este reporte, por ejemplo «¿dónde encuentro el número de lote?» o «¿qué campos son obligatorios?». Para consejos médicos, consulte a un proveedor de salud.",
};

// Spanish keywords the scripted assistant should also match on.
export const esAssistantMatches = [
  ["lote", "número de lote"],
  ["obligatorio", "requerido", "tengo que", "omitir", "en blanco"],
  ["privacidad", "privado", "confidencial", "quién ve"],
  ["causa", "causó", "probar", "culpa"],
  ["guardar", "después", "volver", "retomar", "continuar luego"],
  ["error", "dosis equivocada", "administración"],
  ["documento", "cargar", "subir", "expediente", "foto", "imagen"],
  ["grave", "hospital", "emergencia"],
];
