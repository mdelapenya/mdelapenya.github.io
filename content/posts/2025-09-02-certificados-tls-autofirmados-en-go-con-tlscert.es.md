---
title: "Certificados TLS autofirmados en Go sin esfuerzo con tlscert"
date: 2025-09-02 10:00:00 +0530
description: "Genera certificados TLS autofirmados en Go con facilidad usando tlscert, un paquete ligero para desarrollo local seguro y tests."
categories: [Go, Security, OSS]
tags: ["go", "tls", "security", "certificate", "testing", "open-source"]
type: post
weight: 26
translationKey: tlscert
translatedFrom: 06f5ee3
---

> _"¿Alguna vez has sufrido montando certificados TLS autofirmados para tus tests y servidores de desarrollo en Go? tlscert lo resuelve con una API limpia: sin boilerplate de TLS, solo unas pocas líneas de código."_

## Por qué tlscert

Cuando trabajas en proyectos Go, sobre todo en desarrollo local o en tests de integración, es habitual necesitar certificados autofirmados.

Por desgracia, generarlos suele significar pelearte con APIs de criptografía complejas o copiar y pegar boilerplate.

Ahí es donde entra [tlscert](https://github.com/mdelapenya/tlscert). Es un paquete ligero de Go que te permite generar certificados autofirmados con muy poco esfuerzo. Perfecto para:

- Servidores HTTPS locales
- Tests de integración seguros
- Experimentos TLS cliente-servidor

⚠️ **Nota:** `tlscert` está pensado solo para pruebas y desarrollo local, no para producción.

## Características de un vistazo

- Genera certificados en una línea:
  - `SelfSigned("localhost")`
  - `SelfSignedCA("myca")`
- Crea certificados totalmente personalizados con el struct `Request`:
  - Define los hostnames
  - Elige la duración de la validez
  - Encadena certificados con una CA padre
  - Guarda los certificados en disco
- Usa `Certificate.TLSConfig()` para configurar servidores
- Usa `Certificate.Transport()` para clientes HTTPS
- Dos variantes de funciones:
  - **Simples** (devuelven un certificado `nil` si hay errores)
  - **Versiones E** (devuelven un `error`, para un manejo más seguro)

## Un ejemplo rápido

Aquí tienes un ejemplo completo: genera una CA, crea un certificado de cliente firmado por ella, arranca un servidor HTTPS y haz una petición.

```go
package main

import (
    "fmt"
    "io"
    "log"
    "net/http"
    "os"

    "github.com/mdelapenya/tlscert"
)

func main() {
    // Setup certs directory
    tmp := os.TempDir()
    certsDir := tmp + "/certs"
    os.MkdirAll(certsDir, 0o755)
    defer os.RemoveAll(certsDir)

    // Generate a CA certificate
    caCert, err := tlscert.SelfSignedFromRequestE(tlscert.Request{
		Host:      "localhost",
		Name:      "ca-cert",
		ParentDir: certsDir,
	})
	if err != nil {
		log.Fatalf("Failed to generate CA certificate: %v", err)
	}

    // Generate a client cert signed by the CA
    cert, err := tlscert.SelfSignedFromRequestE(tlscert.Request{
		Host:      "localhost",
		Name:      "client-cert",
		Parent:    caCert,
		ParentDir: certsDir,
	})
	if err != nil {
		log.Fatalf("Failed to generate certificate: %v", err)
	}

    // Start HTTPS server
    server := &http.Server{
        Addr:    ":8443",
        Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            w.Write([]byte("Hello, TLS!"))
        }),
    }
    go server.ListenAndServeTLS(cert.CertPath, cert.KeyPath)
    defer server.Close()

    // HTTPS client using generated cert
    client := &http.Client{Transport: cert.Transport()}
    resp, err := client.Get("https://localhost:8443")
    if err != nil {
        log.Fatalf("Failed to get response: %v", err)
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Failed to read response body: %v", err)
	}

    // It should print "Hello, TLS!"
	fmt.Println(string(body))
}
```

Y ya está: tienes un cliente y un servidor seguros sin ninguna complicación.

## Por qué elegir tlscert

⚡ Pensado para desarrolladores: esconde el boilerplate de criptografía y mantiene tu código limpio.

🔒 Tests más seguros: comprueba que la comunicación TLS funciona sin fiarte de certificados cualquiera y sin hardcodear certificados que se romperán en el futuro.

📜 Licencia MIT: adoptar el paquete es fácil y no te traerá problemas legales.

## Primeros pasos

Instala el paquete:

```bash
go get github.com/mdelapenya/tlscert
```

Importa y genera tu primer certificado:

```go
cert := tlscert.SelfSigned("localhost")
cert, err := tlscert.SelfSignedE("localhost")
```

Úsalo en tus tests de servidores Go o de clientes HTTP con total facilidad.

## Para terminar

`tlscert` simplifica una tarea que suele ser un dolor, para que puedas centrarte en construir funcionalidades y no tengas que preocuparte por la criptografía.

👉 Pruébalo hoy: [github.com/mdelapenya/tlscert](https://github.com/mdelapenya/tlscert)

⭐ Dale una estrella al repo si te resulta útil, y no dudes en [abrir issues](https://github.com/mdelapenya/tlscert/issues) o PRs con mejoras.
