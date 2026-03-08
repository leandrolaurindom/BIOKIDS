# 🏪 Guia: Publicar o BioKids na Play Store (TWA)

## O que é TWA?
**Trusted Web Activity (TWA)** é a forma oficial do Google de publicar um PWA como app Android na Play Store — sem precisar reescrever o código. O BioKids já é um PWA perfeito para isso!

---

## ✅ Pré-requisitos

- [ ] Conta no [Google Play Console](https://play.google.com/console) (~R$125 taxa única)
- [ ] Node.js 18+ instalado no computador
- [ ] Java JDK 17+ instalado
- [ ] Android Studio (para assinar o APK)
- [ ] Seu app hospedado em HTTPS (ex: Vercel, Netlify, Firebase Hosting)

---

## 📋 Etapa 1 — Hospedar o App Online (HTTPS obrigatório)

### Opção A: Vercel (Recomendado — gratuito)
```bash
npm install -g vercel
cd biokids
vercel deploy
# Anote a URL: https://biokids-xxx.vercel.app
```

### Opção B: Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

> ⚠️ O app precisa estar rodando em HTTPS antes de continuar!

---

## 📋 Etapa 2 — Instalar o Bubblewrap (ferramenta TWA do Google)

```bash
npm install -g @bubblewrap/cli
```

---

## 📋 Etapa 3 — Criar o projeto TWA

```bash
mkdir biokids-twa
cd biokids-twa

bubblewrap init --manifest https://SUA-URL-AQUI/manifest.webmanifest
```

Responda as perguntas:
| Pergunta | Resposta |
|---|---|
| Application ID | `com.seunome.biokids` |
| App Name | `BioKids` |
| Short Name | `BioKids` |
| Host | `SUA-URL-AQUI` (sem https://) |
| Start URL | `/` |
| Icon URL | URL do icon 512x512 |
| Display mode | `standalone` |
| Orientation | `portrait` |

---

## 📋 Etapa 4 — Gerar o APK/AAB

```bash
bubblewrap build
```

Isso gera:
- `app-release-signed.apk` → para testar no celular
- `app-release-bundle.aab` → para enviar à Play Store

---

## 📋 Etapa 5 — Vincular o domínio (Digital Asset Links)

Crie o arquivo na raiz do seu site:
**`/.well-known/assetlinks.json`**

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.seunome.biokids",
    "sha256_cert_fingerprints": ["COLE_AQUI_A_FINGERPRINT"]
  }
}]
```

### Como obter a fingerprint:
```bash
bubblewrap fingerprint add
# Ou:
keytool -list -v -keystore android.keystore
```

> 💡 Sem esse arquivo, o app abre como navegador, não como app nativo!

---

## 📋 Etapa 6 — Testar no celular

```bash
# Instalar no celular via USB (modo desenvolvedor ativado)
adb install app-release-signed.apk
```

Verifique se a barra do navegador **não aparece** — se não aparecer, o Digital Asset Link está funcionando!

---

## 📋 Etapa 7 — Enviar para a Play Store

1. Acesse [play.google.com/console](https://play.google.com/console)
2. Crie um novo app → **Aplicativo Android**
3. Preencha:
   - Nome: `BioKids – Descobrindo o Mundo Animal`
   - Categoria: **Educação**
   - Classificação: **Livre para todos**
4. Upload do **AAB**: `app-release-bundle.aab`
5. Adicione screenshots (mínimo 2 de celular)
6. Preencha a política de privacidade (obrigatório)
7. Enviar para revisão (~3-7 dias)

---

## 🔑 API Key do Gemini no App

O BioKids usa a API do Gemini. Para o app publicado funcionar:

1. Acesse [aistudio.google.com](https://aistudio.google.com) → Get API Key
2. Crie um arquivo `.env` na raiz:
```
GEMINI_API_KEY=sua_chave_aqui
```
3. Faça rebuild antes de publicar:
```bash
npm run build
```

> ⚠️ Nunca exponha a chave diretamente no código!
> Recomendamos usar um backend proxy para produção.

---

## 🏷️ Ficha técnica para a Play Store

**Nome completo:** BioKids – Descobrindo o Mundo Animal

**Descrição curta (80 chars):**
> Explore a natureza! Fotografe animais e monte seu álbum científico com IA!

**Descrição completa:**
> BioKids é o companheiro perfeito para pequenos exploradores! Com a inteligência artificial do Gemini, a mascote Jojô ajuda as crianças a identificar animais e insetos usando fotos ou descrições.
>
> 🔬 FUNCIONALIDADES:
> • Identifique animais por foto ou descrição com IA
> • Monte um álbum científico com até 50 espécies
> • Animal do Dia com curiosidades educativas
> • Quiz e Jogo de Habitats
> • Sistema de conquistas e badges
> • Funciona offline!
>
> 🌿 Ideal para: crianças de 5 a 12 anos, passeios na natureza, parques e jardins.

**Categoria:** Educação  
**Tags:** natureza, animais, ciência, educação infantil, biologia  
**Classificação:** Livre (sem restrições)

---

## 📦 Checklist Final

- [ ] App hospedado em HTTPS e funcionando
- [ ] PWA manifest com todos os ícones (72 a 512px)
- [ ] `assetlinks.json` no servidor
- [ ] APK testado no celular sem barra de navegador
- [ ] Screenshots capturadas (min. 2)
- [ ] Política de privacidade publicada
- [ ] API Key segura (não exposta no frontend)
- [ ] AAB gerado e enviado ao Play Console

---

## 💡 Dicas Extras

- **Ícones**: Use [maskable.app](https://maskable.app/editor) para criar ícones maskable
- **Screenshots**: Capture em celular físico com 390x844px ou use emulador
- **Política de privacidade**: Use [privacypolicygenerator.info](https://www.privacypolicygenerator.info) (grátis)
- **Testes**: Adicione amigos como testadores internos antes de lançar

---

*Guia gerado para o projeto BioKids — Março 2026*
