<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Validated settings and anonymous browser scope.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility\local;

/**
 * Settings boundary; no administrator-provided CSS or URLs reach the browser.
 */
final class configuration {
    /** @var string[] Tools shipped by version 2026101600, the only list migrated automatically. */
    public const ORIGINAL_TOOLS = [
        'fontsize', 'bold', 'lineheight', 'letterspacing', 'dyslexia', 'links', 'headings',
        'monochrome', 'lowsaturation', 'highsaturation', 'highcontrast', 'lightcontrast',
        'darkcontrast', 'cursor', 'guide', 'animations',
    ];

    /** @var string[] Bundled tool identifiers. */
    public const TOOLS = [
        'fontsize', 'bold', 'lineheight', 'letterspacing', 'dyslexia', 'links', 'headings',
        'monochrome', 'lowsaturation', 'highsaturation', 'highcontrast', 'lightcontrast',
        'darkcontrast', 'cursor', 'guide', 'animations',
        'hideimages', 'imagetooltips',
    ];

    /** @var string[] Interface labels sent to the browser besides the tool names. */
    public const LABELS = [
        'title', 'open', 'close', 'reset', 'increase', 'decrease', 'status',
        'profilesgroup', 'contentgroup', 'visualgroup', 'colourgroup', 'toolsgroup',
        'language', 'language_en', 'language_pt_br',
        'profile_seizure_safe', 'profile_seizure_safe_desc',
        'profile_visually_impaired', 'profile_visually_impaired_desc', 'profile_adhd_friendly',
        'profile_adhd_friendly_desc', 'profile_cognitive_learning', 'profile_cognitive_learning_desc',
    ];

    /** @var string[] Allowed trigger positions. */
    public const POSITIONS = ['center-left', 'center-right', 'bottom-left', 'bottom-right', 'top-left', 'top-right'];

    /**
     * Normalise stored settings, including values changed outside the settings UI.
     * @param \stdClass $raw Stored values
     * @return array Validated settings
     */
    public static function normalise(\stdClass $raw): array {
        $result = [];
        foreach (['enabled', 'showlogin', 'showadmin', 'persist'] as $name) {
            $result[$name] = !isset($raw->$name) || (string) $raw->$name === '1';
        }
        $selected = isset($raw->tools) && is_string($raw->tools) ? explode(',', $raw->tools) : self::TOOLS;
        $result['tools'] = array_values(array_intersect(self::TOOLS, array_map('trim', $selected)));
        foreach (['position', 'mobileposition'] as $name) {
            $result[$name] = in_array($raw->$name ?? '', self::POSITIONS, true) ? $raw->$name : 'center-right';
        }
        $result += self::dimensions($raw);
        $result += self::colours($raw);
        try {
            $result['excludedcourses'] = self::course_ids((string) ($raw->excludedcourses ?? ''));
        } catch (\invalid_parameter_exception $exception) {
            // Reject the entire malformed exclusion list; never coerce "123invalid" to course 123.
            $result['excludedcourses'] = [];
        }
        return $result;
    }

    /**
     * Validate launcher dimensions and offsets independently of the other settings.
     * @param \stdClass $raw Stored values
     * @return array Bounded sizes and offsets
     */
    private static function dimensions(\stdClass $raw): array {
        $result = [];
        $defaults = [
            'size' => 56,
            'mobilesize' => 56,
            'offsetx' => 20,
            'offsety' => 20,
            'mobileoffsetx' => 12,
            'mobileoffsety' => 12,
        ];
        foreach ($defaults as $name => $default) {
            $min = strpos($name, 'size') !== false ? 48 : 0;
            $max = $min === 48 ? 96 : 200;
            $value = filter_var($raw->$name ?? $default, FILTER_VALIDATE_INT);
            $result[$name] = $value === false ? $default : max($min, min($max, $value));
        }
        return $result;
    }

    /**
     * Validate the two launcher colours and preserve readable foreground contrast.
     * @param \stdClass $raw Stored values
     * @return array Validated colours
     */
    private static function colours(\stdClass $raw): array {
        $result = [];
        foreach (['colour' => '#0848CA', 'textcolour' => '#FFFFFF'] as $name => $default) {
            $value = $raw->$name ?? '';
            $result[$name] = is_string($value) && preg_match('/^#[a-f0-9]{6}$/iD', $value) ? $value : $default;
        }
        if (self::contrast_ratio($result['colour'], $result['textcolour']) < 4.5) {
            $result['textcolour'] = self::contrast_ratio($result['colour'], '#000000') >=
                self::contrast_ratio($result['colour'], '#FFFFFF') ? '#000000' : '#FFFFFF';
        }
        return $result;
    }

    /**
     * Parse course IDs without partial integer coercion.
     * @param string $raw Comma/whitespace separated positive IDs
     * @return int[] Unique IDs
     */
    public static function course_ids(string $raw): array {
        $ids = [];
        foreach (preg_split('/[\s,]+/', trim($raw), -1, PREG_SPLIT_NO_EMPTY) as $value) {
            if (!ctype_digit($value) || (int) $value < 1 || filter_var($value, FILTER_VALIDATE_INT) === false) {
                throw new \invalid_parameter_exception('Course IDs must be positive integers.');
            }
            $ids[] = (int) $value;
        }
        return array_values(array_unique($ids));
    }

    /**
     * Decide whether an upgrade should extend the stored tool list with the tools added after the first release.
     * Only the untouched original default list is extended; any administrator customisation is preserved.
     * @param string|false|null $stored Value stored in the "tools" setting
     * @return string|null New comma-separated list, or null when nothing must change
     */
    public static function migrate_tools($stored): ?string {
        if (!is_string($stored)) {
            return null;
        }
        $selected = array_map('trim', explode(',', $stored));
        if (
            count($selected) !== count(self::ORIGINAL_TOOLS) ||
                array_diff(self::ORIGINAL_TOOLS, $selected) || array_diff($selected, self::ORIGINAL_TOOLS)
        ) {
            return null;
        }
        return implode(',', self::TOOLS);
    }

    /**
     * Create a stable random session scope. The owner ID never leaves the server.
     * @return string Namespaced storage key
     */
    public static function storage_scope(): string {
        global $CFG, $SESSION, $USER;
        $owner = empty($USER->id) ? 'visitor' : (isguestuser() ? 'guest' : 'user:' . (int) $USER->id);
        $scope = $SESSION->local_sisaccessibility ?? null;
        if (
            !is_array($scope) || ($scope['owner'] ?? '') !== $owner ||
                !preg_match('/^[a-f0-9]{32}$/D', $scope['nonce'] ?? '')
        ) {
            $scope = ['owner' => $owner, 'nonce' => bin2hex(random_bytes(16))];
            $SESSION->local_sisaccessibility = $scope;
        }
        return 'local_sisaccessibility:v1:' . substr(hash('sha256', $CFG->wwwroot), 0, 16) . ':' . $scope['nonce'];
    }

    /**
     * Clear transient state on authentication changes, including logout/login to the same account.
     */
    public static function reset_scope(): void {
        global $SESSION;
        unset($SESSION->local_sisaccessibility);
    }

    /**
     * Prepare the public configuration without policy-only fields or account identifiers.
     * @param array $config Validated settings
     * @return array Public configuration
     */
    public static function for_client(array $config): array {
        foreach (['enabled', 'showlogin', 'showadmin', 'excludedcourses'] as $name) {
            unset($config[$name]);
        }
        $config['scope'] = self::storage_scope();
        $config['language'] = current_language();
        $config['languages'] = self::installed_languages($config['language']);
        $config['logourl'] = (new \moodle_url('/local/sisaccessibility/pix/sis-logo.png'))->out(false);
        $config['labels'] = [];
        foreach (array_merge(self::TOOLS, self::LABELS) as $name) {
            $config['labels'][$name] = get_string($name, 'local_sisaccessibility');
        }
        return $config;
    }

    /**
     * Installed language packs for the interface language selector.
     * @param string $current Current language, always offered so the selector never lists nothing
     * @return array Language names indexed by code
     */
    public static function installed_languages(string $current): array {
        $languages = [];
        foreach (get_string_manager()->get_list_of_translations() as $code => $name) {
            $languages[(string) $code] = (string) $name;
        }
        return $languages ?: [$current => $current];
    }

    /**
     * Pass translated configuration through escaped HTML rather than AMD arguments.
     * @param array $config Validated settings
     * @return array Mustache context, escaped by the template's double braces
     */
    public static function template_context(array $config): array {
        return ['config' => json_encode(
            self::for_client($config),
            JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR
        )];
    }

    /**
     * Compute WCAG relative luminance contrast for validated hexadecimal colours.
     * @param string $first Six-digit hexadecimal colour
     * @param string $second Six-digit hexadecimal colour
     * @return float Contrast ratio from 1 to 21
     */
    public static function contrast_ratio(string $first, string $second): float {
        $luminance = static function (string $colour): float {
            $components = [];
            foreach ([1, 3, 5] as $offset) {
                $channel = hexdec(substr($colour, $offset, 2)) / 255;
                $components[] = $channel <= 0.04045 ? $channel / 12.92 : pow(($channel + 0.055) / 1.055, 2.4);
            }
            return 0.2126 * $components[0] + 0.7152 * $components[1] + 0.0722 * $components[2];
        };
        $a = $luminance($first);
        $b = $luminance($second);
        return (max($a, $b) + 0.05) / (min($a, $b) + 0.05);
    }
}
