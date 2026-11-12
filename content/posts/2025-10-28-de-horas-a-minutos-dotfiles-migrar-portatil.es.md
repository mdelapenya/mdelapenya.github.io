---
title: "De horas a minutos: cómo los dotfiles cambiaron mi forma de migrar de portátil"
date: 2025-10-28 09:00:00 +0100
description: "Convierte la migración de portátil, que era una odisea de varios días, en un proceso automático de 25 minutos. Una guía práctica para tratar tu entorno de desarrollo como código."
categories: [Development, DevOps, Productivity]
tags: ["dotfiles", "automation", "macos", "productivity", "devops", "shell", "homebrew"]
type: post
weight: 28
translationKey: dotfiles-laptop-migration
translatedFrom: 65d5ad4
---

![Migración de portátil con dotfiles](/images/posts/2025-10-28-dotfiles/cover.png)

## El problema: el temido cambio de portátil

Nos ha pasado a todos. Te llega un MacBook flamante y, en lugar de ponerte a trabajar, pasas el día siguiente (o la semana) intentando recordar:

- ¿Qué paquetes de Homebrew tenía instalados?
- ¿Cuáles eran mis alias de bash/zsh?
- ¿Cómo tenía configurado Git?
- ¿Dónde están mis claves SSH?
- ¿Qué extensiones de VSCode usaba?
- ¿Qué versión de Node, Go, Java y Python necesito?

El enfoque tradicional es una mezcla de:
1. Copiar archivos a mano de una máquina a otra
2. Buscar en Google "cómo exportar extensiones de VSCode"
3. Hacer capturas de pantalla de los paneles de ajustes
4. Preguntar a los compañeros "¿qué usaba yo para X?"
5. Olvidarte sin remedio de algo crítico y descubrirlo semanas después

**¿El resultado?** Productividad perdida, frustración y la sensación molesta de que ya no eres tan eficiente como en tu máquina anterior.

## La solución: dotfiles como código

Los dotfiles son archivos de configuración de los sistemas tipo Unix (archivos que empiezan por un punto, como `.bashrc`, `.gitconfig` o `.zshrc`). Si tratas tu entorno de desarrollo como código (versionado, documentado y reproducible), puedes convertir la migración de portátil, que era una odisea de varios días, en un proceso automático de menos de 30 minutos.

Así lo resolví yo, y así puedes hacerlo tú.

## Mi configuración: qué se automatiza

Mi repositorio de dotfiles gestiona todo lo que hace falta para un entorno de desarrollo completo. La configuración del shell incluye alias propios (como `g` para git o `k` para kubectl), atajos de navegación y una gestión inteligente de versiones para Python, Node y Go. El historial del shell se conserva, así que aquel comando perfecto que ejecutaste hace tres meses no se pierde nunca.

Con Homebrew automatizo la instalación de las herramientas de línea de comandos: lenguajes como Go, Python, Node.js, Java, Rust y Ruby; herramientas cloud como AWS CLI, Google Cloud SDK, Azure CLI y Terraform; herramientas de contenedores como Docker, Kubernetes, Helm y Skaffold; además de bases de datos, utilidades de Git y muchas más que he ido acumulando con los años. Las aplicaciones con interfaz gráfica reciben el mismo trato: navegadores, VSCode con las extensiones ya instaladas, herramientas de productividad y utilidades como Rectangle e iTerm2.

Los gestores de versiones (GVM para Go, SDKMAN para Java, NVM para Node.js, pyenv para Python) se instalan solos. Lo esencial en seguridad, como las claves SSH, las claves GPG para firmar commits, las credenciales de AWS y las configuraciones de Kubernetes, también se restaura. Hasta los datos personales (documentos, fotos, repositorios de código y configuraciones privadas) se traspasan sin dolor.

## Migrar de portátil con tres comandos

Cuando toca cambiar de portátil, este es todo mi proceso:

### En el Mac viejo (20-25 minutos):
```bash
# Backup everything to NAS or another machine
backup-mac nas:/volume1/backups/laptop
```

Este único comando:
- Prueba la conectividad SSH
- Configura la autenticación sin contraseña si hace falta
- Hace backup de todos los archivos críticos y muestra el progreso
- Excluye la basura (node_modules, logs, cachés)
- Usa compresión y keepalive para aguantar transferencias grandes

### En el Mac nuevo (20-25 minutos):
```bash
# Step 1: Get the dotfiles (1 minute)
git clone https://github.com/mdelapenya/dotfiles.git ~/.dotfiles
cd ~/.dotfiles

# Step 2: Restore from backup (10-15 minutes)
restore-mac nas:/volume1/backups/laptop

# Step 3: Install everything (10 minutes)
./install.sh
```

Y ya está. En serio.

El script `install.sh`:
1. Instala Homebrew (si hace falta)
2. Crea enlaces simbólicos de todos los dotfiles en tu directorio home
3. Instala las herramientas de línea de comandos a partir de una lista curada
4. Instala las aplicaciones con interfaz gráfica
5. Configura los gestores de versiones (GVM, SDKMAN)
6. Instala las extensiones de VSCode

Cuando abres la terminal en la máquina nueva, todos tus alias funcionan. Cuando haces `git commit`, tu firma GPG está ahí. Cuando entras por SSH a un servidor, tus claves están listas. **Te sientes en casa desde el primer minuto.**

## Cómo está construido

Todo el sistema gira en torno a una idea sencilla: en lugar de documentar instrucciones paso a paso, mantengo listas declarativas. ¿Quieres añadir una herramienta nueva? Añádela al final de `scripts/formulas.txt` y vuelve a ejecutar el instalador. El enfoque escala de maravilla. He ido añadiendo muchas herramientas con el tiempo y la instalación no se ha vuelto más compleja.

Un reto fue separar la configuración pública de los datos privados. Mi repositorio de dotfiles es público en GitHub, pero las API keys y los ajustes del trabajo tienen que quedarse en privado. Lo resolví con archivos como `.extra` y `.company`, que git ignora pero que sí entran en el backup. Se cargan automáticamente cuando existen, así que los dotfiles funcionan igual tanto si usas los valores públicos por defecto como si usas tus ajustes privados.

Los scripts también están pensados para poder ejecutarse varias veces sin riesgo. Los enlaces simbólicos hacen que, cuando actualizo un dotfile en el repositorio, el cambio esté activo al instante en todas partes. El script de restauración pregunta antes de sobrescribir archivos existentes. No pasa nada destructivo sin confirmación, aunque puedes saltarte las preguntas con el flag `-f` si vas sobre seguro.

Aprendí por las malas que macOS trae rsync 2.6.9, de 2006. Instalar la versión moderna con Homebrew te da cosas como un mejor informe de progreso y un manejo más fino de las transferencias grandes. Ahora el script de restauración lo documenta y usa las funciones modernas de rsync cuando están disponibles, con alternativas para las versiones antiguas.

## Qué cambió

La mejora más evidente es el tiempo. Lo que antes me llevaba horas repartidas en varios días ahora me lleva minutos. Pero las ganancias de verdad van más allá.

Todas las máquinas en las que trabajo son ahora idénticas. Si algo funciona en mi portátil, funciona en cualquier sitio. El "en mi máquina funciona" ya no existe como excusa, porque puedo recrear mi máquina donde sea en menos de media hora.

También dejé de olvidarme de cosas. Antes de los dotfiles, perdía el tiempo buscando en el historial de Slack "¿cómo configuré otra vez la firma con GPG?". Ahora está en `./scripts/setup-gpg.sh`. ¿Qué plugins de kubectl uso de verdad? Están ahí, en `formulas.txt`. Mis dotfiles se convirtieron en documentación ejecutable de todo mi entorno.

Esta forma de trabajar también me quitó el miedo a experimentar. ¿Quieres probar un multiplexor de terminal nuevo? Instálalo, añádelo a tu lista de paquetes y haz commit. ¿No te convence? Quítalo de la lista. El repositorio pasa a ser un historial curado de cómo evolucionan tus preferencias, y siempre puedes volver atrás.

Cuando se incorpora una persona nueva al equipo, antes le pasábamos una wiki de 50 páginas que inevitablemente estaba desactualizada. Ahora hace un fork del repositorio, personaliza la configuración de Git con su nombre y su email, ejecuta el instalador y en cuestión de minutos trabaja con un entorno rodado.

## Lo que aprendí por el camino

Esto no ocurrió de la noche a la mañana. Empecé con unos alias básicos de bash y fui haciendo crecer el sistema con el tiempo. Cada vez que me pillaba configurando algo a mano, me preguntaba: "¿Se podría automatizar esto?". Casi siempre la respuesta era que sí.

La primera vez que restauré en una máquina nueva, descubrí que se me había olvidado hacer backup de mi directorio `.kube`. Ahora pruebo el proceso de backup y restauración de forma periódica, sobre todo después de añadir directorios nuevos a la lista del backup. Mejor encontrar los huecos en una prueba que en una migración de verdad.

Los NAS también tienen sus manías. El mío requería activar "SSH public key authentication" en la interfaz web, y no era nada obvio. Estuve una hora buscando el fallo hasta dar con el ajuste. Ahora está documentado en el README, y así le ahorro a mi yo del futuro (y a cualquiera) caer en el mismo agujero.

El historial de Git se ha convertido en un registro fascinante de cómo han cambiado mis preferencias. Puedo ver exactamente cuándo añadí las herramientas de Kubernetes, cuándo pasé de Bash a Zsh y cuándo empecé a firmar los commits con GPG. Es como un diario técnico de mi entorno de desarrollo a lo largo de los años.

## Haz un fork y personalízalo

Mis dotfiles son open source: [github.com/mdelapenya/dotfiles](https://github.com/mdelapenya/dotfiles)

Para usarlos como punto de partida:

1. **Haz un fork del repositorio**
2. **Personaliza estos archivos:**
   - `git/.gitconfig` - Tu nombre, tu email y tu clave GPG
   - `scripts/formulas.txt` - Añade o quita paquetes
   - `scripts/cask.txt` - Añade o quita aplicaciones con interfaz gráfica
   - `scripts/backup-mac.sh` - Ajusta el array BACKUP_ITEMS
3. **Ejecuta el instalador:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dotfiles.git ~/.dotfiles
   cd ~/.dotfiles
   ./install.sh
   ```

## El panorama general

Los dotfiles no son solo comodidad. Tienen que ver con:

- **Reproducibilidad:** la ciencia necesita experimentos reproducibles. La ingeniería de software también.
- **Documentación:** tus dotfiles son documentación ejecutable de tu entorno.
- **Continuidad:** tu memoria muscular funciona en todas tus máquinas.
- **Confianza:** prueba herramientas nuevas sin miedo. Tu entorno curado está siempre a un `git clone` de distancia.

## Conclusión

La próxima vez que estrenes portátil (por un trabajo nuevo, por una renovación o porque el viejo ha tenido un encontronazo con una taza de café), estarás productivo en minutos, no en días.

Tu yo del futuro te lo agradecerá. Tu yo de hoy tiene que ponerse ya.

---

**P.D.** ¿Tienes preguntas sobre dotfiles? ¿Quieres compartir tu configuración? Soy [@mdelapenya](https://github.com/mdelapenya) en GitHub. Aprendamos unos de las configuraciones de otros.

**P.P.D.** Gracias especiales a la comunidad open source de dotfiles, y en particular a Víctor Martínez (@v1v) y a su magnífico repositorio [dotfiles-linux](https://github.com/v1v/dotfiles). Esta configuración nació de ideas que tomé prestadas de su repositorio. Esa es la belleza de la configuración abierta: todos subimos de nivel juntos.
