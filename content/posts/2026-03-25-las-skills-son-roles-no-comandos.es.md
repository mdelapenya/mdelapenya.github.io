---
title: "Las skills son roles, no comandos"
date: 2026-03-25 09:00:00 +0100
description: 'Un comando dice "ejecuta deploy". Una skill dice "eres el ingeniero de despliegues". Esa diferencia cambia cómo las diseñas.'
categories: [Technology, AI, Software Development]
tags: ["claude-code", "coding-agents", "skills", "developer-experience"]
type: post
weight: 30
translationKey: skills-are-roles-not-commands
translatedFrom: f4d2f0c
---

![Las skills son roles, no comandos](/images/posts/2026-03-25-skills-are-roles-not-commands/cover.png)

Yo las llamaba comandos. `/blog-editor`, `/deploy`, `/fix-issue`. Verbos en imperativo. Haz esto. Pero cuanto más las usaba, más claro me quedaba que el modelo mental era el equivocado. Una skill no es un comando. Es un rol.

Un comando dice "ejecuta deploy". Una skill dice "eres el ingeniero de despliegues. Este es tu proceso, tus límites y tus herramientas". Uno ejecuta un procedimiento. La otra encarna a un personaje.

Esa diferencia cambia cómo las escribes, cómo las usa el agente y cómo se combinan entre sí.

## Los comandos son verbos, las skills son personajes

Cuando piensas en `/deploy` como un comando, lo escribes como un script: paso 1, paso 2, paso 3, listo. El agente sigue instrucciones. Si pasa algo inesperado, las instrucciones no lo cubren y el agente improvisa sin ninguna guía.

Cuando piensas en `/deploy` como un rol, lo escribes distinto. Describes *quién* es el ingeniero de despliegues: qué sabe, qué tiene permitido hacer, cómo gestiona los fallos, qué comprueba antes y después. El agente ya no se limita a seguir pasos. Decide como decidiría ese rol.

La diferencia se nota cuando algo sale mal. Una skill escrita como comando dice "pasa los tests y haz push". ¿Y si los tests fallan? Las instrucciones no lo dicen. Una skill escrita como rol dice "eres el ingeniero de despliegues. Pasas los tests. Si fallan, diagnosticas el fallo, decides si es un test inestable (flaky) o un problema real, y actúas en consecuencia". El rol lleva criterio incorporado. El comando no.

## La equivalencia

Cada elemento de un fichero [SKILL.md](https://code.claude.com/docs/en/skills) se corresponde con una propiedad de un rol:

**`description`**: cuándo hace falta este rol. Claude lee las descripciones para decidir qué rol asumir. "Revisa y edita posts existentes del blog, aplicando las convenciones de front matter, el tono, la estructura y la concisión" no es la descripción de un comando. Es la descripción de un puesto de trabajo.

**`allowed-tools`**: lo que este rol está autorizado a hacer. El blog-keeper puede leer ficheros y consultar URLs, pero no puede editar nada. Eso no es una restricción de herramientas. Es un ámbito de responsabilidad. Un auditor no hace cambios. Informa de lo que encuentra.

**`disable-model-invocation: true`**: un rol que solo entra en acción cuando lo llamas de forma explícita. El ingeniero de despliegues no se presenta sin que lo invites. Lo convocas cuando llega el momento de desplegar.

**`user-invocable: false`**: conocimiento de fondo que el rol lleva consigo sin ser una acción. Convenciones de APIs, estándares de código, contexto del dominio. No son cosas que "ejecutas". Son cosas que el agente *sabe* cuando está en el rol adecuado.

**Ficheros de apoyo**: los manuales y el material de referencia del rol. La [plantilla de front matter del blog-writer](https://github.com/mdelapenya/blog-skills), el mapa de temas del blog-planner, la guía de plataformas del blog-marketer. Un rol no se lo aprende todo de memoria. Sabe dónde buscar.

## Tres roles que uso a diario

**El editor** (`blog-editor`) revisa mis posts: tono, estructura, concisión. Pasa una [lista de comprobación](/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day): cumplimiento del front matter, densidad de las secciones, redundancias, uso de rayas largas, referencias cruzadas. Cuando termina, llama al guardián para validar los enlaces. El editor no se limita a marcar casillas. Propone arreglos. Me pregunta cuando una reestructuración necesita mi criterio. Es un revisor con opiniones.

**El especialista en builds** (`build-engineer`) sabe compilar binarios, configurar el PATH, saltarse la autenticación y hacer cross-build para distintas plataformas. El [tester exploratorio](/es/posts/2026-03-11-agentes-de-codigo-como-testers-exploratorios/) no lleva instrucciones de build. Se las pide al especialista. "Necesito un binario con la autenticación desactivada para hacer pruebas". El especialista se encarga del resto. Eso no es llamar a un comando. Es consultar a un compañero.

**El project manager** (`project-manager`) clasifica los hallazgos de las pruebas. Prepara una tabla resumen, elimina duplicados contra las issues que ya existen en GitHub, asigna severidad y me va guiando por cada issue, de una en una. No arregla nada. Arreglar es trabajo de otro rol. El project manager coordina.

Cada uno es un personaje con un ámbito de responsabilidad, unas herramientas y una forma de pensar. No un script con pasos.

## Por qué cambia la forma de escribir skills

Cuando piensas en "comando", la skill se lee como una receta. Cuando piensas en "rol", se lee como el documento de bienvenida de alguien que se incorpora al equipo: qué sabes, qué puedes hacer, cómo manejas la ambigüedad, cuándo toca pedir ayuda.

La diferencia práctica aparece en los bordes. El [tester exploratorio](/es/posts/2026-03-11-agentes-de-codigo-como-testers-exploratorios/) se topa en macOS con el límite de longitud de la ruta de un socket. Una skill escrita como comando fallaría. La skill escrita como rol lee su guía de resolución de problemas, entiende la causa de fondo, reintenta con una ruta más corta y sigue adelante. Eso no es seguir instrucciones. Es habitar un rol.

La próxima vez que escribas una skill, no te preguntes "¿qué tiene que hacer este comando?". Pregúntate "¿quién es esta persona y cómo trabaja?".

---

_Recursos:_
- _[Documentación de las skills de Claude Code](https://code.claude.com/docs/en/skills)_
- _[Repositorio blog-skills](https://github.com/mdelapenya/blog-skills)_
