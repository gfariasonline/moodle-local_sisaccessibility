# SIS Accessibility (local_sisaccessibility)

SIS Accessibility adds a locally hosted accessibility toolbar to standard Moodle web pages.
Developed by **Thiago Serrão** for [GFARIAS](https://gfarias.com), it provides display and
reading adjustments using bundled Sienna resources and Moodle-specific integrations.
No CDN, third-party API, telemetry or external asset download is required.

## Requirements and status

- **Release:** 0.2.0-dev, alpha (`2026101601`). Use a test environment before deployment.
- **Minimum Moodle:** 4.5 (`2024100700`). The intended range is Moodle 4.5–5.3;
  the complete installation and integration test matrix is still pending.
- **PHP:** use the PHP version and extensions required by your Moodle release.
- No additional Moodle plugins are required. Compiled JavaScript, fonts and icons are included.
- Local Moodle 5.3 smoke checks do not establish compatibility across all target versions.
  Authenticated course flows, assistive technology and the full version matrix need further validation.

## Features

The toolbar includes 18 tools:

| Group | Tools |
| --- | --- |
| Text and reading | Text size (100–200%), bold text, line height, letter spacing, OpenDyslexic font, highlighted links and highlighted headings |
| Colour | Monochrome, low saturation, high saturation, high contrast, light contrast and dark contrast |
| Visual assistance | Large cursor, reading guide and pause CSS animations |
| Images | Hide images and show image descriptions from alternative text |

Colour modes are mutually exclusive. Four presets combine enabled tools: **Less motion**,
**Low vision**, **Focus**, and **Reading and learning**. A preset is available only when its
required tools are enabled. Focus uses the reading guide: a transparent 60 px strip with a
darkened surround, following the pointer or keyboard focus.

The panel uses native buttons and a modal dialog, supports keyboard navigation and Escape,
and includes a reset control. The default colour is Sienna blue (`#0848CA`). Desktop and
mobile launcher positions can be configured independently, including vertically centred
left and right positions. The installed-language selector appears at the end of the panel,
above the footer with the SIS logo and the GFARIAS website link.

## Installation

Back up the site and test the plugin before installing it in production.

1. Download the plugin ZIP and use **Site administration > Plugins > Install plugins**,
   or extract its `sisaccessibility` directory into `local/` beneath Moodle's effective
   web root. On installations using a `public/` web root, the destination is
   `public/local/sisaccessibility`.
2. Alternatively, clone the repository into that same destination:

   ```sh
   git clone https://github.com/gfariasonline/moodle-local_sisaccessibility.git local/sisaccessibility
   ```

   Run this command from the effective web root; the final directory must be named
   `sisaccessibility`.
3. Complete the installation through **Site administration > Notifications**, or run the
   following commands from the Moodle application root containing `admin/cli/`:

   ```sh
   php admin/cli/upgrade.php --non-interactive
   php admin/cli/purge_caches.php
   ```

   In a `public/` layout, these CLI scripts remain in the application root rather than
   inside `public/`.

## Configuration

Open **Site administration > Plugins > Local plugins > SIS Accessibility**.
Changing settings requires the `moodle/site:config` capability.

Administrators can enable the toolbar, control its appearance on login and administration
pages, exclude courses by ID, select tools, and enable browser preference persistence.
Launcher position, size and offsets have separate desktop and mobile settings. Background
and text colours are configurable, with a contrast fallback for the text colour.

Visitors and signed-in users can use the tools on eligible standard HTML pages. Embedded,
print, popup and maintenance layouts are excluded. CLI, server-side AJAX and web-service
responses do not receive the toolbar.

## Privacy

When persistence is enabled, tool preferences are stored in the browser's `localStorage`
with a maximum lifetime of 90 days. Storage keys use an installation hash and a random
Moodle-session scope. The scope is renewed on authentication changes; account identifiers
are not sent to the widget. A new session does not restore another session's choices.
Blocked browser storage falls back to memory.

The plugin creates no user-data tables or account preference records. It declares browser
storage and transient core Moodle session metadata through Moodle's Privacy API. There is
no automatic transfer to external services. Following the GFARIAS footer link opens that
external website in a new tab.

Reset removes the current effects and active storage entry. Expired plugin entries are
cleaned opportunistically. Server-side uninstallation cannot erase browser storage;
users can clear remaining entries through their browser's site-data controls.

## Limitations

The tools do not adapt content inside iframes, H5P, LTI or SCORM packages, or the native
Moodle App. Pausing CSS animations does not stop video, audio, animated GIFs or JavaScript
activity behaviour. Editors, form controls, icons and other protected elements are excluded
from relevant page effects. Theme and activity combinations require practical testing.
This toolbar does not certify WCAG compliance or replace accessible course content.

## Upgrade and uninstall

Replace the plugin directory with the new version, complete Moodle's upgrade process and
purge caches. Retain a backup and validate custom settings and representative course pages.
To uninstall, use Moodle's plugin management interface, then remove the plugin directory.
Browser preference cleanup remains a local browser operation as described above.

## Support and licence

Report reproducible problems through the [GitHub issue tracker](https://github.com/gfariasonline/moodle-local_sisaccessibility/issues),
including Moodle, PHP, theme and browser versions, reproduction steps and relevant errors.
Do not include passwords or personal data. Maintainer: **Thiago Serrão**, [GFARIAS](https://gfarias.com).

Plugin code is licensed under [GNU GPL v3 or later](LICENSE). Bundled dependencies retain
their own licences and attribution, recorded in [thirdpartylibs.xml](thirdpartylibs.xml):

- Sienna Accessibility Widget 2.0.1: [MIT](thirdparty/sienna/LICENSE).
- OpenDyslexic: [SIL Open Font License 1.1](fonts/OFL.txt).
- Google Material icon: [Apache 2.0](thirdparty/icons/material/LICENSE).
- Lucide icons: [ISC and MIT](thirdparty/icons/lucide/LICENSE).
