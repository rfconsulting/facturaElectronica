# ADR-001: Stack y sesión de autenticación

Estado: aceptado para la iteración inicial.

Se adopta el mismo stack de la referencia: Node.js 20, Express 5, MySQL, `express-session`, `express-mysql-session`, `bcryptjs`, Helmet y frontend HTML/CSS/JS. Se eligen sesiones opacas almacenadas del lado servidor en lugar de JWT para facilitar revocación, reducir datos expuestos al navegador y conservar coherencia con el sistema de referencia.

Consecuencias: el servidor depende de MySQL para autenticar y mantener sesiones; el despliegue debe usar HTTPS y proteger `SESSION_SECRET`. La simplicidad del frontend reduce el toolchain, pero exige mantener accesibilidad y validación tanto en cliente como en servidor.
