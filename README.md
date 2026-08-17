# Persoonlijke AI Nieuwspodcast

Local-first generator voor een dagelijkse Nederlandstalige AI-nieuwspodcast.

De dagelijkse generatie draait op deze Mac. De output is een statische podcastsite in `docs/` met:

- `docs/feed/<token>/rss.xml`
- `docs/audio/*.mp3`
- `docs/assets/artwork.png`
- `docs/robots.txt`

De beoogde gratis hosting is GitHub Pages, met `docs/` als Pages source.

## Kosten

Terugkerende kosten: 0 euro.

Deze setup gebruikt geen betaalde TTS, geen OpenAI TTS, geen ElevenLabs, geen betaalde database, geen podcast-hostingdienst en geen betaalde nieuws-API. Nieuws komt uit openbare RSS-feeds. Audio komt uit lokale macOS-stemmen of, optioneel later, een gratis lokale Piper-installatie.

## Lokale TTS-keuze

Onderzochte route:

- Kokoro: interessant, maar de gangbare open-source stemmen/CLI ondersteunen momenteel geen Nederlands.
- Piper: gratis en lokaal, maar Nederlandse stemmen moeten per stem getest worden; recente signalen rond `nl_NL`-kwaliteit zijn wisselend.
- macOS `say`: gratis, lokaal, accountloos, direct beschikbaar op deze Mac met `Xander` (`nl_NL`) en `Ellen` (`nl_BE`).

Huidige default: Piper `nl_NL-mls-medium`.

Eenmalige lokale Piper setup:

```bash
uv tool install piper-tts
mkdir -p models/piper
curl -L --fail -o models/piper/nl_NL-mls-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/mls/medium/nl_NL-mls-medium.onnx
curl -L --fail -o models/piper/nl_NL-mls-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/mls/medium/nl_NL-mls-medium.onnx.json
```

De modelbestanden staan lokaal in `models/` en worden niet naar GitHub gepusht.

De testbestanden staan in:

- `samples/tts-xander.mp3`
- `samples/tts-ellen.mp3`
- `samples/tts-piper-nl_NL-mls-medium.mp3`
- `samples/tts-evaluation.md`

Nieuwe test draaien:

```bash
npm run test:tts
```

## Configuratie

Maak `.env.local` op basis van `.env.example`:

```bash
FEED_TOKEN=een-lange-random-token
PUBLIC_BASE_URL=https://gebruikersnaam.github.io/repository
```

`FEED_TOKEN` staat in het pad van de RSS-feed. Pocket Casts ondersteunt private feed-URLs, maar de URL moet publiek bereikbaar zijn. Daarom gebruikt deze setup geen loginflow of basic auth.

Pas bronnen en voorkeuren aan in:

- `config/sources.json`
- `config/podcast.json`

## Handmatig genereren

```bash
npm run generate
```

Forceer een nieuwe testaflevering:

```bash
npm run generate:force
```

Valideer de lokale feed:

```bash
npm run validate:feed
```

Valideer de gepubliceerde feed en audio-URL:

```bash
npm run validate:public
```

## Scheduler

Installeer launchd:

```bash
npm run setup:launchd
```

De taak draait:

- bij login/wake via `RunAtLoad`
- dagelijks om 06:15 lokale Mac-tijd
- elk uur als catch-up

De generator checkt zelf of er voor de Europe/Amsterdam-kalenderdag al een aflevering bestaat. Daardoor geeft een dubbele launchd-start geen dubbele aflevering.

Logs:

- `.data/logs/podcast.log`
- `.data/logs/launchd.out.log`
- `.data/logs/launchd.err.log`

## Publiceren via GitHub Pages

Configureer een GitHub repository met Pages source `main` branch, folder `/docs`.

Zodra de remote staat:

```bash
git remote add origin git@github.com:<user>/<repo>.git
git push -u origin main
npm run publish
```

Daarna wordt bij elke dagelijkse run automatisch `docs/` gecommit en gepusht. Als er geen remote staat, slaat `npm run publish` publiceren over zonder de generatie te breken.

## Pocket Casts

De feed-URL heeft deze vorm:

```text
https://<user>.github.io/<repo>/feed/<FEED_TOKEN>/rss.xml
```

Voeg die URL toe via de zoekbalk in Pocket Casts of via `https://pocketcasts.com/submit/` en kies daar Private.

De RSS bevat:

- unieke GUID per aflevering
- `pubDate` in RFC 2822-formaat
- `enclosure` met `audio/mpeg`, lengte en absolute URL
- `itunes:duration`
- `itunes:block` op `Yes`
- shownotes met bronlinks
- `robots.txt` en noindex-signalen

## Betrouwbaarheid

De workflow heeft:

- idempotency per lokale kalenderdag
- lockfile tegen gelijktijdige runs
- persistent lokale state van gebruikte story-URLs
- RSS-validatie
- audio-validatie op duur en bestandsgrootte
- fallback bij bronnnen die tijdelijk niet bereikbaar zijn
- geen credentials in Git

Als een run faalt voordat script, audio en metadata klaar zijn, wordt de nieuwe aflevering niet aan de feed toegevoegd.

## Actuele docs die zijn meegenomen

- Pocket Casts ondersteunt toevoegen via RSS-feed URL en private feeds via een unieke feed-URL.
- Pocket Casts raadt aan private feeds via de submit-flow als Private te markeren.
- Apple Podcasts RSS-richtlijnen zijn gebruikt voor `enclosure`, GUID, `pubDate`, MIME type, duration en artwork.
