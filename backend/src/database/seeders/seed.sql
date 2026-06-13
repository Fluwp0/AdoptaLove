USE adoptalove;

INSERT IGNORE INTO usuarios 
(id, nombre, email, rut, password_hash, telefono, direccion, rol, estado)
VALUES
(1, 'Administrador AdoptaLove', 'admin@adoptalove.cl', '12.345.678-5', 'hash_admin_demo', '+56911111111', 'Santiago, Chile', 'administrador', 'activo'),
(2, 'Fundación Patitas Felices', 'contacto@patitasfelices.cl', '9.876.543-3', 'hash_fundacion_demo', '+56922222222', 'Providencia, Santiago', 'fundacion', 'activo'),
(3, 'Fundación Huellitas', 'contacto@huellitas.cl', '11.222.333-9', 'hash_fundacion_demo', '+56933333333', 'Maipú, Santiago', 'fundacion', 'activo'),
(4, 'Ana Morales', 'ana.morales@gmail.com', '15.444.333-9', 'hash_adoptante_demo', '+56944444444', 'Ñuñoa, Santiago', 'adoptante', 'activo'),
(5, 'Carlos Rojas', 'carlos.rojas@gmail.com', '17.666.555-6', 'hash_adoptante_demo', '+56955555555', 'La Florida, Santiago', 'adoptante', 'activo');

INSERT IGNORE INTO mascotas
(id, publicado_por_usuario_id, nombre, especie, raza, sexo, edad_anios, tamano, descripcion, foto_url, estado)
VALUES
(1, 2, 'Luna', 'Perro', 'Mestiza', 'hembra', 2, 'mediano', 'Perrita tranquila, cariñosa y buena con niños.', 'https://example.com/luna.jpg', 'disponible'),
(2, 2, 'Max', 'Perro', 'Labrador', 'macho', 4, 'grande', 'Perro juguetón, ideal para familia con patio.', 'https://example.com/max.jpg', 'disponible'),
(3, 3, 'Michi', 'Gato', 'Doméstico pelo corto', 'macho', 1, 'pequeno', 'Gatito curioso, limpio y muy sociable.', 'https://example.com/michi.jpg', 'disponible'),
(4, 3, 'Nala', 'Gato', 'Carey', 'hembra', 3, 'pequeno', 'Gatita independiente, ideal para departamento.', 'https://example.com/nala.jpg', 'en_revision');

INSERT IGNORE INTO solicitudes_adopcion
(id, adoptante_usuario_id, mascota_id, mensaje, estado)
VALUES
(1, 4, 1, 'Me gustaría adoptar a Luna porque tengo tiempo y espacio para cuidarla.', 'aprobada'),
(2, 5, 3, 'Estoy interesado en Michi, vivo en departamento y busco un gato tranquilo.', 'pendiente');

INSERT IGNORE INTO adopciones
(id, solicitud_adopcion_id, adoptante_usuario_id, mascota_id, estado, observaciones)
VALUES
(1, 1, 4, 1, 'activa', 'Adopción aprobada como caso de prueba.');

INSERT IGNORE INTO donaciones
(id, usuario_id, monto, moneda, metodo_pago, estado, referencia_pago, mensaje)
VALUES
(1, 4, 10000.00, 'CLP', 'webpay', 'completada', 'DON-001', 'Donación para apoyar alimentación de mascotas.'),
(2, 5, 5000.00, 'CLP', 'transferencia', 'pendiente', 'DON-002', 'Aporte solidario para la fundación.');

INSERT IGNORE INTO chatbot_preguntas
(id, pregunta, categoria, estado)
VALUES
(1, '¿Cómo puedo adoptar una mascota?', 'adopcion', 'activa'),
(2, '¿Qué necesito para postular a una adopción?', 'adopcion', 'activa'),
(3, '¿Puedo donar a una fundación?', 'donaciones', 'activa'),
(4, '¿Cómo cuido a un perro recién adoptado?', 'cuidados', 'activa'),
(5, '¿Para qué sirve el quiz de compatibilidad?', 'compatibilidad', 'activa'),
(6, '¿Cómo contacto a una fundación?', 'adopcion', 'activa'),
(7, '¿Cómo funcionan las donaciones?', 'donaciones', 'activa');

INSERT IGNORE INTO chatbot_respuestas
(id, pregunta_id, respuesta, estado)
VALUES
(1, 1, 'Debes elegir una mascota disponible, completar la solicitud y esperar la revisión de la fundación.', 'activa'),
(2, 2, 'Necesitas tus datos personales, información de tu hogar y una explicación de por qué quieres adoptar.', 'activa'),
(3, 3, 'Sí, puedes realizar una donación desde la sección de donaciones de la plataforma.', 'activa'),
(4, 4, 'Dale tiempo para adaptarse, prepara agua, comida, cama y agenda una revisión veterinaria.', 'activa'),
(5, 5, 'El quiz de compatibilidad te ayuda a encontrar mascotas que podrían adaptarse mejor a tu hogar, tu tiempo disponible y tus preferencias.', 'activa'),
(6, 6, 'Puedes contactar a una fundación desde el detalle de una mascota o completando una postulación para que revisen tu solicitud.', 'activa'),
(7, 7, 'Las donaciones de AdoptaLove ayudan a mantener la plataforma activa para que más fundaciones publiquen mascotas y lleguen a más adoptantes.', 'activa');

INSERT IGNORE INTO preguntas_compatibilidad
(id, pregunta, tipo_respuesta, opciones, peso, estado)
VALUES
(1, '¿Qué tipo de mascota prefieres?', 'opcion_unica', '["Perro", "Gato", "Me da igual"]', 1.00, 'activa'),
(2, '¿Cuánto tiempo libre tienes al día?', 'opcion_unica', '["Menos de 1 hora", "1 a 3 horas", "Más de 3 horas"]', 1.00, 'activa'),
(3, '¿Vives en casa o departamento?', 'opcion_unica', '["Casa", "Departamento"]', 1.00, 'activa'),
(4, '¿Hay niños en tu hogar?', 'opcion_unica', '["Sí", "No"]', 1.00, 'activa');

INSERT IGNORE INTO respuestas_compatibilidad
(id, usuario_id, pregunta_id, respuesta_texto, respuesta_numero, respuesta_json)
VALUES
(1, 4, 1, 'Perro', NULL, '{"respuesta":"Perro"}'),
(2, 4, 2, 'Más de 3 horas', NULL, '{"respuesta":"Más de 3 horas"}'),
(3, 4, 3, 'Casa', NULL, '{"respuesta":"Casa"}'),
(4, 5, 1, 'Gato', NULL, '{"respuesta":"Gato"}'),
(5, 5, 2, '1 a 3 horas', NULL, '{"respuesta":"1 a 3 horas"}');
