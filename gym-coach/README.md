# GymCoach: tu entrenador personal

Es una web app (PWA) para el iPhone y el ordenador. Hace estas cosas:

- **Te genera un plan** según los días que entrenas: 2 o 3 días de cuerpo completo, o 4 días de torso/pierna.
- **Calibra tus pesos** con una sesión de prueba.
- **Ajusta los pesos solo** con doble progresión: sube repeticiones y, cuando llegas al tope, sube peso. Si fallas, baja el peso. Hace una semana de descarga cada 5.
- **Se reajusta si faltas**: la rotación nunca se salta sesiones. Si te quedan pocos días en la semana te propone una sesión combinada. Si vuelves tras un parón, te baja los pesos.
- **Fotos de cada máquina** y sustitutos por si no está o está ocupada.
- **Gráficas**: fuerza estimada por ejercicio, series por músculo, sesiones por semana y peso corporal.
- **Funciona sin conexión** en el gimnasio. Sincroniza tus datos con un repositorio privado de GitHub.

Las fotos de los ejercicios son de [free-exercise-db](https://github.com/yuhonas/free-exercise-db), de dominio público.

---

## Cómo publicarla (una sola vez)

### 1. Crear la cuenta y el repositorio de la app
1. Crea una cuenta en https://github.com.
2. Crea un repositorio **público** llamado `gym-coach`. GitHub Pages gratis necesita que sea público, pero tus datos irán en otro repo privado.
3. Sube a ese repositorio todo el contenido de esta carpeta.
4. En el repositorio entra en **Settings → Pages**. En *Source* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y pulsa Save.
5. En 1-2 minutos la app estará en `https://TU-USUARIO.github.io/gym-coach/`.

### 2. Instalarla en el iPhone
1. Abre esa dirección en **Safari**.
2. Pulsa el botón Compartir (el cuadrado con la flecha) y elige **Añadir a pantalla de inicio**.
3. Ya tienes el icono de GymCoach, que se abre a pantalla completa como una app.

### 3. Guardar tus datos en GitHub (para verlos en el iPhone y en el ordenador)
1. Crea otro repositorio, esta vez **privado**, llamado `gym-datos`. Marca "Add a README file".
2. Crea un token de acceso:
   - Ve a GitHub → foto de perfil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - En *Repository access* elige **Only select repositories** y selecciona `gym-datos`.
   - En *Permissions → Repository permissions → Contents* elige **Read and write**.
   - Genera el token y cópialo. Empieza por `github_pat_`.
3. En la app ve a **Ajustes → Sincronizar con GitHub** y pon tu usuario, `gym-datos` y el token. Pulsa **Guardar y probar**.
4. Repite el paso 3 en cada dispositivo (iPhone y ordenador). A partir de ahí los datos se sincronizan solos al abrir la app y al terminar cada entreno.

> El token solo da acceso al repositorio `gym-datos`, se guarda únicamente en tu dispositivo y solo se envía a GitHub. Si lo pierdes o caduca, crea otro y vuelve a ponerlo.

## Probarla en el ordenador sin publicar

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Después abre http://localhost:8080.

## Estructura

| Archivo | Qué hace |
|---|---|
| `js/exercises.js` | Catálogo de ejercicios, fotos y grupos de sustitutos |
| `js/program.js` | Planes, calibración, progresión, reajuste semanal y nutrición |
| `js/storage.js` | Guardado local y sincronización con GitHub |
| `js/charts.js` | Gráficas SVG |
| `js/app.js` | Interfaz |
| `sw.js` | Funcionamiento sin conexión |
