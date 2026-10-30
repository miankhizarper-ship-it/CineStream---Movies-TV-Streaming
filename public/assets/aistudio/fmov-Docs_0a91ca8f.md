Embed Documentation
Comprehensive guide for webmasters, developers, and stream publishers. Integrate our ultra-fast multi-server video player, customize branding logos, configure auto-failover, and communicate via postMessage.

Getting Started
Integrate the player using a simple iframe. No API keys or registration required.

FMOV provides a complete, modern responsive streaming player that handles multi-server failover, subtitles, custom branding, and episode navigation automatically. Simply embed the iframe URL corresponding to the TMDB ID or AniList ID of your desired title.

Zero Setup
No API keys, tokens, or sign-ups required. Immediate embedding on any domain.
Multi-Server Failover
Automatic client-side failover across priority servers without reloading the page.
Custom Branding
Place your custom logo in the upper right corner with optional click-through links.
Embed Movie
How to embed a movie using its TMDB ID.

https://fmov.my/embed/movie/{tmdb_id}
Standard Route
HTML iFrame

Copy
<iframe 
  src="https://fmov.my/embed/movie/550" 
  width="100%" 
  height="100%" 
  frameborder="0" 
  allowfullscreen 
  allow="autoplay; fullscreen; picture-in-picture; encrypted-media">
</iframe>
Embed TV Series
How to embed a TV series episode using its TMDB ID, season, and episode number.

https://fmov.my/embed/series/{tmdb_id}/{season}/{episode}
Aliases: /embed/tv
HTML iFrame

Copy
<iframe 
  src="https://fmov.my/embed/series/1396/1/1" 
  width="100%" 
  height="100%" 
  frameborder="0" 
  allowfullscreen 
  allow="autoplay; fullscreen; picture-in-picture; encrypted-media">
</iframe>
Embed Anime
How to embed an anime episode using either AniList ID or TMDB ID.

FMOV supports embedding anime with both standard Season/Episode numbering and absolute episode numbering. The player automatically resolves both AniList IDs and TMDB IDs via built-in mappings.

Format 1: Season & Episode
https://fmov.my/embed/anime/{id}/{season}/{episode}
Format 2: Absolute Episode (Defaults to Season 1)
https://fmov.my/embed/anime/{id}/{episode}
HTML iFrame (with AniList ID)

Copy
<iframe 
  src="https://fmov.my/embed/anime/21/1/1" 
  width="100%" 
  height="100%" 
  frameborder="0" 
  allowfullscreen 
  allow="autoplay; fullscreen; picture-in-picture; encrypted-media">
</iframe>
Live Sports Streams
High-performance live sports schedules, matches, and stream player.

Access real-time live sports streams for football (soccer), basketball, tennis, combat sports, racing, and more. Features ultra-low latency direct HLS playback with dynamic quality switching and automatic stream health resolution.

Explore Live Sports Schedule & Streams
Browse live fixtures, match times, stream links, and multi-resolution streams.
Open Live Sports
URL Parameters & Player Configuration
Customize player behavior, colors, buttons, and custom watermark logo by appending query parameters.

Parameter	Type	Default	Description
logo	URL string	none	Custom brand logo/watermark displayed in the upper right corner (PNG, SVG, WebP, or data URI).
logoLink	URL string	none	Optional click-through URL for the custom logo (opens your website in a new tab with rel="noopener").
server	string	auto	Pin a specific streaming server (e.g. vector, core, valence, 4kstream, apex). Omit for auto intelligent priority.
color	hex string	14b8a6	Custom primary accent color for scrubbers, volume sliders, active indicators, and icons (e.g. 14b8a6, 06b6d4, f59e0b).
autoplay	1 / 0	0	Automatically attempts to start playback upon load (subject to browser autoplay policies).
autoplayNextEpisode	boolean	true	Automatically transitions to the next episode when current episode ends.
episodeSelector	boolean	true	Shows or hides the episode selector menu button in the player control bar.
nextEpisode	boolean	true	Controls the next episode skip button.
overlay	boolean	false	Enables Netflix-style "Up Next" popup countdown overlay during the final 15 seconds.
Custom Logo & Watermark Branding
Display your site brand in the upper right corner while keeping the player clean.

Publishers can white-label the player with their own brand logo or watermark. The logo is displayed cleanly in the upper right corner with automatic responsive sizing, subtle shadow, and optional destination hyperlink. The default player logo on the left side has been removed to give your brand complete focus.

HTML iFrame with Custom Logo & Destination Link

Copy
<iframe 
  src="https://fmov.my/embed/movie/550?logo=https%3A%2F%2Fexample.com%2Fmy-logo.png&logoLink=https%3A%2F%2Fexample.com&color=14b8a6" 
  width="100%" 
  height="100%" 
  frameborder="0" 
  allowfullscreen 
  allow="autoplay; fullscreen; picture-in-picture; encrypted-media">
</iframe>
Recommended Logo Specs:
Transparent PNG, SVG, or WebP with height between 32px and 48px. Data URIs are fully supported for self-contained embedding.

Interactive Player Playground
Live testing console to preview themes, responsive device viewports, and logo branding.

Use our visual Playground at /player to test your embeds before deploying:

Device Viewports
Switch seamlessly between Desktop (1920×1080), Tablet (landscape/portrait), and Mobile (iPhone) frames.
Instant Logo Tester
Paste any logo URL or choose from high-res SVG presets (Teal Brand, Gold Cinema, Cyber Violet) with live preview.
Code Generator
One-click copy for clean direct embed URLs or ready-to-paste responsive <iframe> HTML code.
Server Priority & Multi-Server Failover
How the intelligent multi-server fallback engine operates.

By default, FMOV handles streaming server selection automatically. When the player initializes, it probes multiple nodes simultaneously. If the primary streaming node fails (due to geo-restrictions, network timeouts, or expired links), the player silently fails over to the next candidate without stopping playback or requiring a page reload.

Priority Hierarchy
1. Vector
Primary Global High-Speed
2. Core
Ultra-Reliable Resilient
3. Valence
Multi-Source Bandwidth
4. 4K Stream
Ultra HD 2160p Direct
Additional fallback edge mirrors include Apex, Pulse, Orion, Matrix, Nova, Titan, and Ironclad. Users can manually switch servers anytime using the Server menu in the player control bar.

Subtitles & Custom File Drag-and-Drop
Multi-language VTT and SRT support with interactive drag-and-drop.

Subtitles are dynamically aggregated from multiple subtitle providers and TMDB. The player natively parses WebVTT and SRT formats with full UTF-8 encoding support for all languages, including Balkan diacritics (č, ć, đ, š, ž), Cyrillic, Asian, and Arabic scripts.

Drag-and-Drop Custom Subtitle Upload
Users can drag and drop any subtitle file (.srt, .vtt, .ass, .sub, .txt) directly onto the video player. It immediately loads into the player with instant feedback.

Font Size (50% - 200%)
Background Opacity
Custom Text Color
Vertical Offset (Top/Bottom)
Mobile Gestures & Smart TV Remote Navigation
Optimized UX across touchscreens, mobile phones, and television remotes.

Mobile Touch Gestures
Single Tap: Toggles control bar visibility instantly.
Double-Tap Left: Rewinds 10 seconds (-10s ripple).
Double-Tap Right: Fast forwards 10 seconds (+10s ripple).
Responsive Bottom Sheet: Subtitle and server lists open in an ergonomic mobile bottom drawer.
Smart TV D-Pad & Remote Control
Enter / OK / Space: Toggles Play and Pause.
Left / Right Arrows: Fast seeks backward/forward by 10 seconds.
Up / Down Arrows: Smooth volume up and volume down.
Back / Return / ESC: Exits fullscreen or dismisses menus.
Watch Progress & Resume Playback
Persistent session recovery across browser restarts.

The player utilizes browser localStorage to store the user's playback position. If a user refreshes the page or comes back days later, the player will resume from their last timestamp automatically.

JavaScript postMessage API
Communicate with the player iframe securely.

The FMOV player communicates status events to the parent window via window.parent.postMessage. You can listen to these events to synchronize video progress, trigger analytics, or build custom external play/pause buttons.

JavaScript Listener Example

Copy
window.addEventListener("message", (event) => {
    // Optional: verify origin for security
    // if (event.origin !== "https://fmov.my") return;

    const data = event.data;
    if (data && data.source === "fmov") {
        console.log("FMOV Event:", data.event, data.data);
        
        switch (data.event) {
            case "ready":
                console.log("Player initialized");
                break;
            case "play":
                console.log("Playback started");
                break;
            case "pause":
                console.log("Playback paused at:", data.data?.currentTime);
                break;
            case "timeupdate":
                console.log("Progress:", data.data?.currentTime, "/", data.data?.duration);
                break;
            case "ended":
                console.log("Video finished");
                break;
        }
    }
});
CORS & Integration Security
Cross-Origin Resource Sharing.

The FMOV embed URL is fully CORS-enabled. You can embed it on any domain (localhost, Vercel, Netlify, custom domains) without restrictions. All internal stream candidate resolutions and subtitle proxies operate through our edge relays to eliminate CORS blocking.

Troubleshooting & Best Practices
Common integration questions and solutions.

Player shows "Unable to play this video"
This occurs if all fallback nodes are temporarily unavailable or if the title has not had a home/digital streaming release yet. The auto-fallback system will continue to retry candidates automatically.

Layout Shift / Responsive Aspect Ratio
Ensure your iframe wrapper has a defined aspect ratio (e.g. aspect-video or 16:9) or fixed height with width: 100%; height: 100% on the iframe to prevent layout shifts (CLS).

Fullscreen & Picture-in-Picture Permissions
Always include allow="autoplay; fullscreen; picture-in-picture; encrypted-media" and allowfullscreen attributes on your <iframe> tag to enable full native browser features.


